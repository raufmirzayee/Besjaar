#!/usr/bin/env bash
#
# The database test suite.
#
# Inventory arithmetic, row locking, RLS and the staff separation are all
# database behaviour. A mocked Supabase client would prove nothing about any of
# them, so these run against a real PostgreSQL server.
#
#     supabase/tests/run.sh [database]
#
# Builds a throwaway database from the harness plus every migration, runs each
# suite, and reports. Nothing is written to a database you already have unless
# you name one.
set -uo pipefail
cd "$(dirname "$0")/../.."

DB="${1:-besjaar_test}"
FRESH=0

if [ $# -eq 0 ]; then
  FRESH=1
  echo "building $DB from the harness and $(ls supabase/migrations/*.sql | wc -l) migrations"
  dropdb --if-exists "$DB" 2>/dev/null
  createdb "$DB" || { echo "could not create $DB"; exit 1; }
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/harness.sql || exit 1
  for f in $(ls supabase/migrations/*.sql | sort); do
    if ! psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" > /tmp/migration.log 2>&1; then
      echo "MIGRATION FAILED: $(basename "$f")"
      grep -i error /tmp/migration.log | head -5
      exit 1
    fi
  done
  echo "  all migrations applied"
  echo
fi

FAILED=0

run_sql() {
  local name="$1" file="$2"
  echo "--- $name"
  if psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$file" > /tmp/suite.log 2>&1; then
    grep -oP '(?<=NOTICE:  )ok.*' /tmp/suite.log | sed 's/^/  /'
    echo "  PASSED"
  else
    grep -E "ERROR|FAIL" /tmp/suite.log | head -5 | sed 's/^/  /'
    echo "  FAILED"
    FAILED=1
  fi
  echo
}

run_sql "inventory" supabase/tests/inventory.test.sql
run_sql "row-level security" supabase/tests/rls.test.sql

echo "--- concurrency"
if ./supabase/tests/concurrency.test.sh "$DB" 2>&1 | sed 's/^/  /'; then
  echo "  PASSED"
else
  echo "  FAILED"
  FAILED=1
fi
echo

if [ $FRESH -eq 1 ]; then dropdb --if-exists "$DB" 2>/dev/null; fi

if [ $FAILED -eq 0 ]; then
  echo "================================================="
  echo " database suites: all passed"
  echo "================================================="
else
  echo "================================================="
  echo " database suites: FAILURES ABOVE"
  echo "================================================="
fi
exit $FAILED
