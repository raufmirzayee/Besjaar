#!/usr/bin/env node
/**
 * Besjaar — mirror the live Shopify discount configuration into a shop
 * metafield the theme can read.
 *
 * WHY THIS EXISTS
 * ---------------
 * Shopify's Liquid storefront API exposes no discount object. `product`,
 * `variant` and `collection` know nothing about automatic discounts or
 * discount codes; discounts only surface once a line is in the cart
 * (`line_item.discount_allocations`) or at checkout. The only Shopify-native
 * way to put *real* discount facts in front of a shopper while they browse is
 * to copy them out of the Admin API into storefront-readable data.
 *
 * This script does exactly that. It reads the discounts from the Admin API,
 * keeps only the AUTOMATIC ones that can be stated truthfully on a product,
 * resolves collection/variant scoping down to product ids, and writes the
 * result to the shop metafield `besjaar_discounts.active` (type: json).
 *
 * Discount codes are never mirrored. A code only applies once the shopper types
 * it, so it can never justify the struck-through price the storefront shows.
 * A discount is only kept when Shopify applies it by itself, to everyone, with
 * no order minimum and no quantity minimum — which makes the discounted price
 * on the storefront the price that is actually charged.
 *
 * snippets/besjaar-discount-badge.liquid reads that metafield and re-checks
 * every rule's start/end window on each request, so discounts that expire
 * between two runs stop showing without a sync.
 *
 * USAGE
 *   SHOPIFY_STORE=besjaar.myshopify.com \
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxx \
 *   node tools/sync-shopify-discounts.mjs [--dry-run] [--disable]
 *
 * The token comes from a custom app (Settings → Apps and sales channels →
 * Develop apps) with these Admin API scopes:
 *   read_discounts, read_products, write_metafields (and read_metafields)
 *
 * Re-run it whenever you create, edit, pause or delete a discount, or change
 * which products are in a discounted collection. A daily scheduled run is a
 * good safety net — see docs/shopify-discount-visibility.md.
 */

const API_VERSION = '2025-07';
const NAMESPACE = 'besjaar_discounts';
const KEY = 'active';

/** Merchant-facing behaviour, stored alongside the rules. */
const CONFIG = {
  /** Master switch. `--disable` flips this to false without deleting data. */
  enabled: true,
  /**
   * Hide every badge once the mirror is older than this many days. A discount
   * deleted in Shopify lingers here until the next run, so this bounds how long
   * a stale badge can survive. 0 disables the guard (not recommended).
   */
  max_age_days: 30,
};

/**
 * Temporary promotional campaign (Nationale Kraanwaterdag 2026).
 *
 * The campaign never carries a discount of its own. `match_title` names the
 * automatic Shopify discount that powers it; the sync looks that discount up
 * among the ones it is already allowed to advertise and records its id. If no
 * such discount exists, `linked` is false and the theme shows nothing at all —
 * no banner, no campaign badge, no countdown.
 *
 * Set `enabled: false` here and re-run to retire the campaign; see
 * docs/besjaar-water-week-campaign.md.
 */
const CAMPAIGN = {
  enabled: true,
  /** Title (or part of it) of the automatic discount behind the campaign. */
  match_title: 'BESJAAR WATER WEEK',
  name: 'BESJAAR WATER WEEK 💧',
  tagline: 'Meer uit je water. Meer uit je douche.',
  /** {value} is replaced with the discount's real value, e.g. "15%". */
  line_template: 'Profiteer t/m 30 september van {value} korting',
  /** Badge reads "<value> <suffix>", e.g. "15% KORTING". */
  badge_suffix: 'KORTING',
  cta_label: 'Bekijk de actie',
  cta_url: '/collections/showerhead',
  /** Amsterdam time. ends_at is the first moment AFTER the campaign, so the
   *  whole of 30 September is included. */
  starts_at: '2026-09-21T00:00:00+02:00',
  ends_at: '2026-10-01T00:00:00+02:00',
  countdown: true,
  countdown_label: 'Actie eindigt over:',
  /** Market countries that see the banner. [] means everywhere. */
  countries: ['NL'],
};

const store = process.env.SHOPIFY_STORE;
const token = process.env.SHOPIFY_ADMIN_TOKEN;
const dryRun = process.argv.includes('--dry-run');
const disable = process.argv.includes('--disable');

if (!store || !token) {
  console.error('Set SHOPIFY_STORE (my-shop.myshopify.com) and SHOPIFY_ADMIN_TOKEN.');
  process.exit(1);
}

const endpoint = `https://${store}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Admin API ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  if (payload.errors) {
    throw new Error(`GraphQL: ${JSON.stringify(payload.errors)}`);
  }
  return payload.data;
}

const DISCOUNT_FIELDS = `
  id
  discount {
    __typename
    ... on DiscountAutomaticBasic {
      title
      status
      startsAt
      endsAt
      customerGets {
        value {
          ... on DiscountPercentage { percentage }
          ... on DiscountAmount { amount { amount } appliesOnEachItem }
        }
        items {
          ... on AllDiscountItems { allItems }
          ... on DiscountProducts {
            products(first: 250) { nodes { id } }
            productVariants(first: 250) { nodes { id product { id } } }
          }
          ... on DiscountCollections { collections(first: 50) { nodes { id } } }
        }
      }
      minimumRequirement {
        ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity }
        ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount } }
      }
    }
    ... on DiscountCodeBasic { title status }
  }
`;

async function fetchDiscounts() {
  const nodes = [];
  let cursor = null;

  do {
    const data = await gql(
      `query($cursor: String) {
        discountNodes(first: 100, after: $cursor) {
          nodes { ${DISCOUNT_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { cursor }
    );
    nodes.push(...data.discountNodes.nodes);
    cursor = data.discountNodes.pageInfo.hasNextPage ? data.discountNodes.pageInfo.endCursor : null;
  } while (cursor);

  return nodes;
}

const collectionCache = new Map();

async function productsInCollection(collectionId) {
  if (collectionCache.has(collectionId)) return collectionCache.get(collectionId);

  const ids = [];
  let cursor = null;

  do {
    const data = await gql(
      `query($id: ID!, $cursor: String) {
        collection(id: $id) {
          products(first: 250, after: $cursor) {
            nodes { id }
            pageInfo { hasNextPage endCursor }
          }
        }
      }`,
      { id: collectionId, cursor }
    );
    const page = data.collection?.products;
    if (!page) break;
    ids.push(...page.nodes.map((node) => node.id));
    cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (cursor);

  collectionCache.set(collectionId, ids);
  return ids;
}

const numericId = (gid) => String(gid).split('/').pop();
const toCents = (amount) => Math.round(Number(amount) * 100);

/** "|123|456|" — a delimited string, because Liquid's `contains` is reliable
 *  on strings for every type, while array membership on numbers is not. */
const tokenList = (ids) => (ids.length ? `|${[...new Set(ids)].join('|')}|` : '');

function percentageLabel(fraction) {
  const percent = Number((fraction * 100).toFixed(2));
  return `${percent}%`;
}

const skipped = [];

async function buildRule(node) {
  const discount = node.discount;
  const type = discount.__typename;
  const note = (reason) => {
    skipped.push(`${discount.title || node.id} — ${reason}`);
    return null;
  };

  // Codes are never advertised: they are not applied until the shopper types
  // them, so the storefront cannot present the result as the price.
  if (type !== 'DiscountAutomaticBasic') {
    if (type === 'DiscountCodeBasic' && discount.status === 'ACTIVE') {
      return note('discount code (codes are never shown on the storefront)');
    }
    return null;
  }
  // SCHEDULED is kept on purpose: the theme checks startsAt itself, so a
  // discount starts showing the moment it goes live, with no extra sync.
  if (discount.status !== 'ACTIVE' && discount.status !== 'SCHEDULED') return null;

  const value = discount.customerGets?.value ?? {};
  const isPercentage = typeof value.percentage === 'number';
  const isAmount = Boolean(value.amount);
  if (!isPercentage && !isAmount) return note('buy-X-get-Y or app discount');

  // An order-level amount is spread across the whole order, so no single
  // product's price can be restated from it.
  if (isAmount && !value.appliesOnEachItem) {
    return note('fixed amount applied once per order, not per item');
  }

  // A minimum makes the discount conditional, so a discounted price on a
  // product page would not be what a shopper necessarily pays.
  const minimum = discount.minimumRequirement ?? {};
  if (minimum.greaterThanOrEqualToSubtotal) {
    return note(`minimum order value of ${minimum.greaterThanOrEqualToSubtotal.amount}`);
  }
  if (Number(minimum.greaterThanOrEqualToQuantity ?? 0) > 1) {
    return note(`minimum quantity of ${minimum.greaterThanOrEqualToQuantity}`);
  }

  const items = discount.customerGets?.items ?? {};
  let scope = 'products';
  const productIds = [];
  const variantIds = [];

  if (items.allItems) {
    scope = 'all';
  } else {
    for (const product of items.products?.nodes ?? []) {
      productIds.push(numericId(product.id));
    }
    for (const variant of items.productVariants?.nodes ?? []) {
      variantIds.push(numericId(variant.id));
      if (variant.product?.id) productIds.push(numericId(variant.product.id));
    }
    for (const collection of items.collections?.nodes ?? []) {
      const ids = await productsInCollection(collection.id);
      productIds.push(...ids.map(numericId));
    }
    if (!productIds.length) return note('targets no products');
  }

  return {
    id: numericId(node.id),
    title: discount.title,
    method: 'automatic',
    value_type: isPercentage ? 'percentage' : 'fixed_amount',
    percentage_bp: isPercentage ? Math.round(value.percentage * 10000) : 0,
    percentage_label: isPercentage ? percentageLabel(value.percentage) : '',
    amount_cents: isAmount ? toCents(value.amount.amount) : 0,
    each_item: true,
    starts_at: Math.floor(new Date(discount.startsAt).getTime() / 1000),
    ends_at: discount.endsAt ? Math.floor(new Date(discount.endsAt).getTime() / 1000) : null,
    scope,
    product_ids: tokenList(productIds),
    variant_ids: tokenList(variantIds),
    min_subtotal_cents: 0,
    min_quantity: 0,
    customer_eligibility: 'all',
  };
}

const toUnix = (iso) => Math.floor(new Date(iso).getTime() / 1000);

function buildCampaign(rules) {
  if (!CAMPAIGN.enabled) return { enabled: false, linked: false };

  // Only discounts that passed every advertisability check are candidates, so
  // a campaign can never be linked to something the theme would refuse to show.
  const needle = CAMPAIGN.match_title.trim().toLowerCase();
  const match = rules.find((rule) => rule.title.toLowerCase().includes(needle));

  return {
    enabled: true,
    linked: Boolean(match),
    match_title: CAMPAIGN.match_title,
    discount_id: match ? match.id : '',
    name: CAMPAIGN.name,
    tagline: CAMPAIGN.tagline,
    line_template: CAMPAIGN.line_template,
    badge_suffix: CAMPAIGN.badge_suffix,
    cta_label: CAMPAIGN.cta_label,
    cta_url: CAMPAIGN.cta_url,
    starts_at: toUnix(CAMPAIGN.starts_at),
    ends_at: toUnix(CAMPAIGN.ends_at),
    countdown: Boolean(CAMPAIGN.countdown),
    countdown_label: CAMPAIGN.countdown_label,
    countries: tokenList(CAMPAIGN.countries),
  };
}

async function main() {
  const shop = await gql('{ shop { id myshopifyDomain currencyCode } }');

  const nodes = await fetchDiscounts();
  const rules = [];
  for (const node of nodes) {
    const rule = await buildRule(node);
    if (rule) rules.push(rule);
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    version: 1,
    generated_at: now,
    generated_at_iso: new Date(now * 1000).toISOString(),
    enabled: disable ? false : CONFIG.enabled,
    max_age_days: CONFIG.max_age_days,
    currency: shop.shop.currencyCode,
    campaign: buildCampaign(rules),
    rules,
  };

  const serialised = JSON.stringify(payload);
  const bytes = Buffer.byteLength(serialised, 'utf8');
  if (bytes > 60000) {
    throw new Error(
      `Payload is ${bytes} bytes; Shopify caps a metafield value at 64 KB. ` +
        'Narrow the discounts to fewer collections, or split the data across two metafields.'
    );
  }

  console.log(`${rules.length} automatic discount(s) shown on the storefront, ${bytes} bytes:`);
  for (const rule of rules) {
    const value = rule.value_type === 'percentage' ? rule.percentage_label : `${rule.amount_cents / 100}`;
    const reach = rule.scope === 'all' ? 'all products' : `${rule.product_ids.split('|').filter(Boolean).length} product(s)`;
    console.log(`  -${value.padEnd(7)} ${reach.padEnd(16)} ${rule.title}`);
  }
  if (skipped.length) {
    console.log(`\n${skipped.length} discount(s) not shown:`);
    for (const line of skipped) console.log(`  ${line}`);
  }

  const campaign = payload.campaign;
  if (campaign.enabled) {
    if (campaign.linked) {
      const linkedRule = rules.find((rule) => rule.id === campaign.discount_id);
      console.log(`\nCampaign "${campaign.name}" linked to discount "${linkedRule.title}" (${campaign.discount_id}).`);
      console.log(`  runs ${CAMPAIGN.starts_at} → ${CAMPAIGN.ends_at}`);
    } else {
      console.log(`\nCampaign "${campaign.name}" is NOT linked and will not appear.`);
      console.log(`  No advertisable automatic discount has a title containing "${CAMPAIGN.match_title}".`);
      console.log('  Create it in Shopify (Discounts → Amount off products → Automatic),');
      console.log('  give it that title, no minimum requirement, then run this again.');
    }
  }

  if (dryRun) {
    console.log('\n--dry-run: metafield not written.');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const result = await gql(
    `mutation($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id namespace key updatedAt }
        userErrors { field message }
      }
    }`,
    {
      metafields: [
        {
          ownerId: shop.shop.id,
          namespace: NAMESPACE,
          key: KEY,
          type: 'json',
          value: serialised,
        },
      ],
    }
  );

  const errors = result.metafieldsSet.userErrors;
  if (errors.length) {
    throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
  }

  console.log(`\nWrote ${NAMESPACE}.${KEY} on ${shop.shop.myshopifyDomain}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
