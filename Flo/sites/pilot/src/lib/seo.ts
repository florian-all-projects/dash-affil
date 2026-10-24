// Aides SEO : titres bornés, données structurées communes.

/** Titre de page : garde la version longue si elle tient en `max` caractères, sinon la courte, sinon tronque proprement. */
export function title(long: string, short: string, max = 62): string {
  if (long.length <= max) return long;
  if (short.length <= max) return short;
  return short.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

export function breadcrumbLd(site: string, items: Array<{ name: string; href?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.href ? { item: site + it.href } : {}) })),
  };
}

export function faqLd(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function itemListLd(site: string, name: string, urls: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: urls.slice(0, 50).map((u, i) => ({ "@type": "ListItem", position: i + 1, url: site + u })),
  };
}
