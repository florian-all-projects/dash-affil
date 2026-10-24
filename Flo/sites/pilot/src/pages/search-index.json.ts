// Index de recherche instantanée (en-tête) : nom, slug, image, prix « dès ». Chargé au premier focus du champ.
import type { APIRoute } from "astro";
import { CATEGORY_SLUGS } from "../lib/i18n";
import { products, byPopularity } from "../lib/catalog";

const norm = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const GET: APIRoute = () => {
  const list = [...products].sort(byPopularity).map((p) => ({
    n: p.name, s: p.slug, i: p.image.src, p: p.from,
    k: norm(`${p.name} ${CATEGORY_SLUGS[p.category]?.label.en ?? ""} ${CATEGORY_SLUGS[p.category]?.label.fr ?? ""} ${p.strainType ?? ""}`),
  }));
  return new Response(JSON.stringify(list), { headers: { "Content-Type": "application/json" } });
};
