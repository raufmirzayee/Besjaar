// Google Customer Reviews opt-in as a Shopify Custom Pixel (Merchant Center ID 5872663998).
// Paste at: Settings > Customer events > Add custom pixel.
// Adjust DELIVERY_DAYS to your real delivery estimate.
const DELIVERY_DAYS = 5;

analytics.subscribe('checkout_completed', (event) => {
  const checkout = event.data.checkout;
  if (!checkout || !checkout.email) return;
  const est = new Date(Date.now() + DELIVERY_DAYS * 86400000)
    .toISOString().slice(0, 10);

  window.renderOptIn = function () {
    window.gapi.load('surveyoptin', function () {
      window.gapi.surveyoptin.render({
        merchant_id: 5872663998,
        order_id: String(checkout.order && checkout.order.id ? checkout.order.id : checkout.token),
        email: checkout.email,
        delivery_country: (checkout.shippingAddress || checkout.billingAddress || {}).countryCode,
        estimated_delivery_date: est
      });
    });
  };

  const s = document.createElement('script');
  s.src = 'https://apis.google.com/js/platform.js?onload=renderOptIn';
  s.async = true;
  document.head.appendChild(s);
});
