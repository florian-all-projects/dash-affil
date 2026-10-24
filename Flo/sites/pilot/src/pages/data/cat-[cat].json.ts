// Données d'une catégorie entière pour les filtres et le tri côté navigateur (Category.astro).
import type { APIRoute } from "astro";
import { CATEGORY_ORDER } from "../../lib/i18n";
import { productsByCategory, byPopularity } from "../../lib/catalog";

export function getStaticPaths() {
  return CATEGORY_ORDER.filter((c) => productsByCategory(c).length).map((cat) => ({ params: { cat }, props: { cat } }));
}
export const GET: APIRoute = ({ props }) => {
  const list = productsByCategory(props.cat as string).sort(byPopularity).map((p) => ({
    n: p.name, s: p.slug, i: p.image.src, k: p.image.kind, p: p.from, d: p.discount, c: p.shopCount, t: p.strainType,
    sh: p.offers.map((o) => o.shop.slug), u: p.primary.buyUrl, b: p.primary.shop.slug, bn: p.primary.shop.name,
  }));
  return new Response(JSON.stringify(list), { headers: { "Content-Type": "application/json" } });
};
