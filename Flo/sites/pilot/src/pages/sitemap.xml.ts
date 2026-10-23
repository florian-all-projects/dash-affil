// Sitemap bilingue (EN/FR) avec annotations hreflang. Le site est en noindex tant que le NDD n'est pas branché :
// le sitemap est prêt pour l'ouverture, mais robots.txt ne le déclare pas encore.
import type { APIRoute } from "astro";
import { r, CATEGORY_ORDER, type Lang } from "../lib/i18n";
import { products, productsByCategory, shops, productsByShop } from "../lib/catalog";
import { CITIES, PROVINCES } from "../data/geo";

const PAGE = 50;

export const GET: APIRoute = ({ site }) => {
  const base = site!.toString().replace(/\/$/, "");
  const pairs: Array<(l: Lang) => string> = [r.home, r.menu, r.cities, r.shops, r.coupons, r.about, r.guide];
  for (const c of CATEGORY_ORDER) {
    const n = Math.ceil(productsByCategory(c).length / PAGE);
    for (let p = 1; p <= n; p++) pairs.push((l) => r.category(l, c, p));
  }
  for (const p of products) pairs.push((l) => r.product(l, p.slug));
  for (const c of CITIES) pairs.push((l) => r.city(l, c.slug));
  for (const p of PROVINCES) pairs.push((l) => r.province(l, p.slug, p.slugFr));
  for (const s of shops.filter((s) => productsByShop(s.slug).length)) {
    pairs.push((l) => r.shop(l, s.slug), (l) => r.coupon(l, s.slug));
  }
  const urls = pairs.flatMap((f) => {
    const en = base + f("en"), fr = base + f("fr");
    const alt = `<xhtml:link rel="alternate" hreflang="en-CA" href="${en}"/><xhtml:link rel="alternate" hreflang="fr-CA" href="${fr}"/>`;
    return [`<url><loc>${en}</loc>${alt}</url>`, `<url><loc>${fr}</loc>${alt}</url>`];
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
