import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "@/components/admin/settings-page";

export const Route = createFileRoute("/beheer/instellingen/winkel")({
  component: ShopSettingsPage,
});

function ShopSettingsPage() {
  return (
    <CategoryPage
      category="commerce"
      title="admin.page.shop.title"
      description="admin.page.shop.body"
    />
  );
}
