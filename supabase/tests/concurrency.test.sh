#!/usr/bin/env bash
#
# The last-unit race.
#
# Two customers reach checkout for the same single unit at the same moment.
# Exactly one may get it. This cannot be tested inside one transaction — the
# whole point is two sessions contending for a row lock — so it runs as two
# real psql connections that are deliberately made to overlap.
#
# The old code did GREATEST(0, stock - quantity), which clamped to zero and
# happily confirmed both orders. reserve_stock_for_order takes a FOR UPDATE
# lock before it checks, so the second session waits for the first and is then
# refused against the real remaining stock.
#
# Usage:  supabase/tests/concurrency.test.sh [database]
set -uo pipefail

DB="${1:-besjaar}"
PSQL="psql -q -X -v ON_ERROR_STOP=1 -d $DB -t -A"

cleanup() {
  $PSQL -c "DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE email LIKE 'race-%@test.invalid');
            DELETE FROM public.orders WHERE email LIKE 'race-%@test.invalid';
            DELETE FROM public.stock_movements WHERE product_id IN (SELECT id FROM public.products WHERE slug = 'race-test-product');
            DELETE FROM public.products WHERE slug = 'race-test-product';" >/dev/null 2>&1
}
trap cleanup EXIT
cleanup

PRODUCT=$($PSQL -c "INSERT INTO public.products (name, slug, status, regular_price, stock_quantity)
                    VALUES ('Race Test', 'race-test-product', 'active', 10, 0) RETURNING id;")
$PSQL -c "SELECT public.record_stock_movement('$PRODUCT', 1, 'beginvoorraad');" >/dev/null

echo "one unit on the shelf; two buyers arriving together"

buy() {
  local who="$1"
  # pg_advisory_xact_lock makes both sessions start their reservation at the
  # same instant: each waits on the same advisory lock, so neither can slip
  # through before the other has begun.
  $PSQL <<SQL 2>&1
BEGIN;
SELECT pg_advisory_xact_lock(42);
COMMIT;
SELECT CASE WHEN (SELECT count(*) FROM public.create_order_with_items(
  jsonb_build_object(
    'email','race-$who@test.invalid','first_name','$who','last_name','Race',
    'shipping_address','{}'::jsonb,'billing_address','{}'::jsonb,
    'subtotal',10,'shipping_cost',0,'vat_amount',2.1,'total',12.1,
    'status','pending','payment_status','open'),
  jsonb_build_array(jsonb_build_object(
    'product_id','$PRODUCT','product_name','Race Test','quantity',1,
    'unit_price',10,'line_total',10)))) > 0
  THEN '$who RESERVED' ELSE '$who NOTHING' END;
SQL
}

buy buyer-1 > /tmp/race-1.out 2>&1 &
PID1=$!
buy buyer-2 > /tmp/race-2.out 2>&1 &
PID2=$!
wait $PID1 $PID2

# A refused buyer's output is a Postgres error; report the outcome, not the
# stack context, so the result reads as a result.
outcome() {
  if grep -q "RESERVED" "$1"; then echo "RESERVED"
  elif grep -qi "onvoldoende voorraad" "$1"; then echo "REFUSED (insufficient stock)"
  else echo "REFUSED"
  fi
}
echo "  buyer-1: $(outcome /tmp/race-1.out)"
echo "  buyer-2: $(outcome /tmp/race-2.out)"

WON=$($PSQL -c "SELECT count(*) FROM public.orders WHERE email LIKE 'race-%@test.invalid';")
STOCK=$($PSQL -c "SELECT stock_quantity FROM public.products WHERE slug = 'race-test-product';")
RESERVED=$($PSQL -c "SELECT COALESCE(-SUM(quantity_change), 0) FROM public.stock_movements
                     WHERE reason = 'order_placed'
                       AND product_id = (SELECT id FROM public.products WHERE slug = 'race-test-product');")

echo
echo "  orders created:  $WON  (must be 1)"
echo "  units reserved:  $RESERVED  (must be 1)"
echo "  stock remaining: $STOCK  (must be 0)"

FAILED=0
[ "$WON" = "1" ]      || { echo "FAIL: $WON orders were created for one unit"; FAILED=1; }
[ "$RESERVED" = "1" ] || { echo "FAIL: $RESERVED units were reserved from a shelf holding 1"; FAILED=1; }
[ "$STOCK" = "0" ]    || { echo "FAIL: stock ended at $STOCK, not 0"; FAILED=1; }

if [ $FAILED -eq 0 ]; then
  echo
  echo "================================================="
  echo " concurrency: one unit, one winner"
  echo "================================================="
fi
exit $FAILED
