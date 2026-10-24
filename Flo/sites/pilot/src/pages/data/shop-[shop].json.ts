// Catalogue d'une boutique pour le moteur de filtres de sa page.
import type { APIRoute } from "astro";
import { productsByShop, byPopularity, activeShops } from "../../lib/catalog";
import { toRec } from "../../lib/explore";

export const getStaticPaths = () => activeShops.map((s) => ({ params: { shop: s.slug }, props: { shop: s.slug } }));
export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(productsByShop(props.shop as string).sort(byPopularity).map(toRec)), { headers: { "Content-Type": "application/json" } });
