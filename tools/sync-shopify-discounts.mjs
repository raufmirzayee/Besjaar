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
 * keeps only those that can be stated truthfully on a product, resolves
 * collection/variant scoping down to product ids, and writes the result to the
 * shop metafield `besjaar_discounts.active` (type: json).
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
   * Which offer earns the badge when a product has both an automatic discount
   * and a discount code:
   *   'automatic_first' — the automatic one, even if a code is worth more. It
   *                       needs no code, no minimum and no customer action, so
   *                       it is the only one true for every visitor.
   *   'best_value'      — whichever takes more off.
   */
  preference: 'automatic_first',
  /** Mention the runner-up offer on the product page (never on cards). */
  show_secondary_offer: true,
  /**
   * Hide every badge once the mirror is older than this many days. A discount
   * deleted in Shopify lingers here until the next run, so this bounds how long
   * a stale badge can survive. 0 disables the guard (not recommended).
   */
  max_age_days: 30,
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
      combinesWith { orderDiscounts productDiscounts }
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
    ... on DiscountCodeBasic {
      title
      status
      startsAt
      endsAt
      appliesOncePerCustomer
      combinesWith { orderDiscounts productDiscounts }
      codes(first: 1) { nodes { code } }
      customerSelection { __typename }
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

async function buildRule(node) {
  const discount = node.discount;
  const type = discount.__typename;

  if (type !== 'DiscountAutomaticBasic' && type !== 'DiscountCodeBasic') return null;
  // SCHEDULED is kept on purpose: the theme checks startsAt itself, so a
  // discount starts showing the moment it goes live, with no extra sync.
  if (discount.status !== 'ACTIVE' && discount.status !== 'SCHEDULED') return null;

  const value = discount.customerGets?.value ?? {};
  const isPercentage = typeof value.percentage === 'number';
  const isAmount = Boolean(value.amount);
  if (!isPercentage && !isAmount) return null; // BXGY, free shipping, app discounts

  const method = type === 'DiscountAutomaticBasic' ? 'automatic' : 'code';

  // A code limited to named customers or a segment cannot be advertised: the
  // storefront has no way to know whether the visitor qualifies.
  let customerEligibility = 'all';
  if (method === 'code') {
    customerEligibility =
      discount.customerSelection?.__typename === 'DiscountCustomerAll' ? 'all' : 'specific';
  }
  if (customerEligibility !== 'all') return null;

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
    if (!productIds.length) return null; // nothing left to advertise
  }

  const minimum = discount.minimumRequirement ?? {};

  return {
    id: numericId(node.id),
    title: discount.title,
    method,
    code: method === 'code' ? discount.codes?.nodes?.[0]?.code ?? null : null,
    value_type: isPercentage ? 'percentage' : 'fixed_amount',
    percentage_bp: isPercentage ? Math.round(value.percentage * 10000) : 0,
    percentage_label: isPercentage ? percentageLabel(value.percentage) : '',
    amount_cents: isAmount ? toCents(value.amount.amount) : 0,
    each_item: isAmount ? Boolean(value.appliesOnEachItem) : true,
    starts_at: Math.floor(new Date(discount.startsAt).getTime() / 1000),
    ends_at: discount.endsAt ? Math.floor(new Date(discount.endsAt).getTime() / 1000) : null,
    scope,
    product_ids: tokenList(productIds),
    variant_ids: tokenList(variantIds),
    once_per_customer: Boolean(discount.appliesOncePerCustomer),
    min_subtotal_cents: minimum.greaterThanOrEqualToSubtotal
      ? toCents(minimum.greaterThanOrEqualToSubtotal.amount)
      : 0,
    min_quantity: minimum.greaterThanOrEqualToQuantity
      ? Number(minimum.greaterThanOrEqualToQuantity)
      : 0,
    customer_eligibility: customerEligibility,
    combines_with_product: Boolean(discount.combinesWith?.productDiscounts),
    combines_with_order: Boolean(discount.combinesWith?.orderDiscounts),
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
    preference: CONFIG.preference,
    show_secondary_offer: CONFIG.show_secondary_offer,
    max_age_days: CONFIG.max_age_days,
    currency: shop.shop.currencyCode,
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

  console.log(`${rules.length} advertisable discount(s), ${bytes} bytes:`);
  for (const rule of rules) {
    const value = rule.value_type === 'percentage' ? rule.percentage_label : `${rule.amount_cents / 100}`;
    const reach = rule.scope === 'all' ? 'all products' : `${rule.product_ids.split('|').filter(Boolean).length} product(s)`;
    console.log(`  ${rule.method.padEnd(9)} ${value.padEnd(7)} ${reach.padEnd(16)} ${rule.title}${rule.code ? ` (${rule.code})` : ''}`);
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
