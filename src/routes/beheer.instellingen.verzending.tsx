import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "@/components/admin/settings-page";

export const Route = createFileRoute("/beheer/instellingen/verzending")({
  component: ShippingSettingsPage,
});

/**
 * Shipping costs only. The methods themselves — which carrier, which countries
 * — stay where they were: they are catalogue data with their own screen, and
 * moving them here would have split one decision across two places.
 */
function ShippingSettingsPage() {
  return (
    <CategoryPage
      category="shipping"
      title="admin.page.shipping.title"
      description="admin.page.shipping.body"
    />
  );
}
