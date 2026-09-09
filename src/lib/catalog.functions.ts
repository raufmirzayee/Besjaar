import { createServerFn } from "@tanstack/react-start";

import { fetchCategories, fetchProductBySlug, fetchProducts } from "./catalog.server";

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  return fetchCategories();
});

export const getProducts = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      categorySlug?: string;
      search?: string;
      featured?: boolean;
      bestseller?: boolean;
      sort?: "nieuwste" | "prijs-op" | "prijs-af" | "naam";
      limit?: number;
    }) => input ?? {},
  )
  .handler(async ({ data }) => {
    return fetchProducts(data ?? {});
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    return fetchProductBySlug(data.slug);
  });
