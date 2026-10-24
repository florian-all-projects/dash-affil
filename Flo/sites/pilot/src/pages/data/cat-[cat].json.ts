// Liste complète d'une catégorie pour le moteur de filtres (Explorer.astro), au format compact de lib/explore.ts.
import type { APIRoute } from "astro";
import { CATEGORY_ORDER } from "../../lib/i18n";
import { productsByCategory, byPopularity } from "../../lib/catalog";
import { toRec } from "../../lib/explore";

export function getStaticPaths() {
  return CATEGORY_ORDER.filter((c) => productsByCategory(c).length).map((cat) => ({ params: { cat }, props: { cat } }));
}
export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(productsByCategory(props.cat as string).sort(byPopularity).map(toRec)), { headers: { "Content-Type": "application/json" } });
