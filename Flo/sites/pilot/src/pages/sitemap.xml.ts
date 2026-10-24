// Sitemap bilingue (EN/FR) avec annotations hreflang. Le site est en noindex tant que le NDD n'est pas branché :
// le sitemap est prêt pour l'ouverture, mais robots.txt ne le déclare pas encore.
import type { APIRoute } from "astro";
import { r, type Lang } from "../lib/i18n";
import { products, activeShops } from "../lib/catalog";
import { PROVINCES, cities, provSlug, provinceOf } from "../lib/geo";
import { categoryPaths } from "../lib/paths";

export const GET: APIRoute = ({ site }) => {
  const base = site!.toString().replace(/\/$/, "");
  const pairs: Array<(l: Lang) => string> = [r.home, r.catalogue, r.deals, r.delivery, r.shops, r.coupons, r.about, r.legal];
  for (const { props } of categoryPaths("en", false)) pairs.push((l) => r.category(l, props.cat));
  for (const { props } of categoryPaths("en", true)) pairs.push((l) => r.category(l, props.cat, props.page));
  for (const p of products) pairs.push((l) => r.product(l, p.slug));
  for (const p of PROVINCES) pairs.push((l) => r.province(l, provSlug(p, l)));
  for (const c of cities) pairs.push((l) => r.city(l, provSlug(provinceOf(c.province), l), c.slug));
  for (const s of activeShops) pairs.push((l) => r.shop(l, s.slug), (l) => r.coupon(l, s.slug));
  const urls = pairs.flatMap((f) => {
    const en = base + f("en"), fr = base + f("fr");
    const alt = `<xhtml:link rel="alternate" hreflang="en-CA" href="${en}"/><xhtml:link rel="alternate" hreflang="fr-CA" href="${fr}"/>`;
    return [`<url><loc>${en}</loc>${alt}</url>`, `<url><loc>${fr}</loc>${alt}</url>`];
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
