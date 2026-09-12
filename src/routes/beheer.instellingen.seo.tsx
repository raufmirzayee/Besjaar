import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage } from "@/components/admin/settings-page";

export const Route = createFileRoute("/beheer/instellingen/seo")({
  component: SeoSettingsPage,
});

function SeoSettingsPage() {
  return (
    <CategoryPage category="seo" title="admin.page.seo.title" description="admin.page.seo.body" />
  );
}
