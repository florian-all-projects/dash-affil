import type { APIRoute } from "astro";
import { products } from "../../lib/catalog";
import { COLLECTIONS } from "../../data/collections";
import { toRec } from "../../lib/explore";
export const getStaticPaths = () => COLLECTIONS.map((c) => ({ params: { key: c.key }, props: { key: c.key } }));
export const GET: APIRoute = ({ props }) => {
  const c = COLLECTIONS.find((x) => x.key === props.key)!;
  return new Response(JSON.stringify(products.filter(c.filter).sort(c.rank).map(toRec)), { headers: { "Content-Type": "application/json" } });
};
