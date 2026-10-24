import type { APIRoute } from "astro";
import { dealsSet } from "../../lib/sets";
import { toRec } from "../../lib/explore";
export const GET: APIRoute = () => new Response(JSON.stringify(dealsSet().map(toRec)), { headers: { "Content-Type": "application/json" } });
