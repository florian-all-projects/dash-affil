import type { APIRoute } from "astro";
import { newArrivals } from "../../lib/sets";
import { toRec } from "../../lib/explore";
export const GET: APIRoute = () => new Response(JSON.stringify(newArrivals().list.sort((a, b) => b.firstSeen.localeCompare(a.firstSeen)).map(toRec)), { headers: { "Content-Type": "application/json" } });
