/**
 * Whether this deployment may take an order, and on whose money.
 *
 * Checkout used to proceed whatever the payment configuration was: with no
 * Mollie key it created a real order, reserved real inventory, and told the
 * customer payment was not available. The order was honest about not being
 * paid, but the stock was gone — a shop deployed before its payment account is
 * ready would quietly sell out of everything.
 *
 * Three modes, and the default is the safe one:
 *
 *   disabled  no orders, no stock movement. What a deployment runs on until
 *             someone decides otherwise.
 *   test      orders and stock are real, the money is not. For staging.
 *   live      real orders, real money.
 *
 * The mismatch checks matter as much as the modes. A test key in live mode
 * means customers think they have paid and no money arrives. A live key in
 * test mode means a staging run charges real cards.
 *
 * Pure and side-effect free so it can be tested without a deployment; the
 * server reads the environment and passes it in.
 */

export type CheckoutMode = "disabled" | "test" | "live";

export type CheckoutGate =
  | { allowed: true; mode: "test" | "live"; usingTestKey: boolean }
  | { allowed: false; mode: CheckoutMode; reason: string; operatorMessage: string };

export type CheckoutEnvironment = {
  /** CHECKOUT_MODE, verbatim. */
  mode: string | undefined;
  /** MOLLIE_API_KEY, verbatim. Never logged, never returned. */
  mollieApiKey: string | undefined;
  /** NODE_ENV, to pick the default when the mode is unset. */
  nodeEnv: string | undefined;
};

/**
 * The mode this environment is in.
 *
 * Unset means `disabled` in production and `test` everywhere else: a
 * production deployment that nobody has configured must not be able to take
 * money, and a developer who has just cloned the repository should not have to
 * set a variable before the checkout page works.
 */
export function resolveCheckoutMode(env: CheckoutEnvironment): CheckoutMode {
  const raw = env.mode?.trim().toLowerCase();
  if (raw === "live" || raw === "test" || raw === "disabled") return raw;
  return env.nodeEnv === "production" ? "disabled" : "test";
}

/** Which Mollie environment a key belongs to. Mollie prefixes them. */
export function classifyMollieKey(key: string | undefined): "live" | "test" | "none" | "unknown" {
  const trimmed = key?.trim();
  if (!trimmed) return "none";
  if (trimmed.startsWith("live_")) return "live";
  if (trimmed.startsWith("test_")) return "test";
  return "unknown";
}

/**
 * Whether an order may be created right now.
 *
 * `reason` is what the customer is told — it says the shop cannot take orders,
 * and nothing about why. `operatorMessage` is what goes in the server log and
 * the admin, and names the variable to set.
 */
export function checkoutGate(env: CheckoutEnvironment): CheckoutGate {
  const mode = resolveCheckoutMode(env);
  const customerMessage =
    "Bestellen is op dit moment niet mogelijk. Probeer het later opnieuw of neem contact met ons op.";

  if (mode === "disabled") {
    return {
      allowed: false,
      mode,
      reason: customerMessage,
      operatorMessage:
        env.mode === undefined
          ? "CHECKOUT_MODE is not set, so checkout is disabled. Set CHECKOUT_MODE=test or CHECKOUT_MODE=live once the payment provider is configured."
          : "CHECKOUT_MODE=disabled. No orders are accepted and no stock is reserved.",
    };
  }

  const keyKind = classifyMollieKey(env.mollieApiKey);

  if (keyKind === "none") {
    return {
      allowed: false,
      mode,
      reason: customerMessage,
      operatorMessage: `CHECKOUT_MODE=${mode} but MOLLIE_API_KEY is not set. Checkout is refused rather than creating orders that reserve stock nobody can pay for.`,
    };
  }

  if (keyKind === "unknown") {
    return {
      allowed: false,
      mode,
      reason: customerMessage,
      operatorMessage:
        "MOLLIE_API_KEY does not start with live_ or test_, so which environment it belongs to cannot be established. Checkout is refused rather than guessed.",
    };
  }

  if (mode === "live" && keyKind === "test") {
    return {
      allowed: false,
      mode,
      reason: customerMessage,
      operatorMessage:
        "CHECKOUT_MODE=live with a Mollie test key. Customers would complete a payment that never charges them and never pays you. Use a live_ key, or set CHECKOUT_MODE=test.",
    };
  }

  if (mode === "test" && keyKind === "live") {
    return {
      allowed: false,
      mode,
      reason: customerMessage,
      operatorMessage:
        "CHECKOUT_MODE=test with a Mollie live key. A staging run would charge real cards. Use a test_ key, or set CHECKOUT_MODE=live.",
    };
  }

  return { allowed: true, mode, usingTestKey: keyKind === "test" };
}
