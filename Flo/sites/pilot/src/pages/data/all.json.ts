// Catalogue entier (promotions, nouveautés, recherche) pour le moteur de filtres.
import type { APIRoute } from "astro";
import { products, byPopularity } from "../../lib/catalog";
import { toRec } from "../../lib/explore";

export const GET: APIRoute = () => new Response(JSON.stringify([...products].sort(byPopularity).map(toRec)), { headers: { "Content-Type": "application/json" } });
