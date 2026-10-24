// Langues, routes et libellés d'interface (EN à la racine, FR sous /fr/).
export type Lang = "en" | "fr";
export const LANGS: Lang[] = ["en", "fr"];

export const CATEGORY_SLUGS: Record<string, { en: string; fr: string; label: { en: string; fr: string }; one: { en: string; fr: string } }> = {
  flower: { en: "flower", fr: "fleurs", label: { en: "Flower", fr: "Fleurs" }, one: { en: "flower", fr: "fleur" } },
  edible: { en: "edibles", fr: "comestibles", label: { en: "Edibles", fr: "Comestibles" }, one: { en: "edible", fr: "comestible" } },
  concentrate: { en: "concentrates", fr: "concentres", label: { en: "Concentrates", fr: "Concentrés" }, one: { en: "concentrate", fr: "concentré" } },
  vape: { en: "vapes", fr: "vapoteuses", label: { en: "Vapes", fr: "Vapoteuses" }, one: { en: "vape", fr: "vapoteuse" } },
  cbd: { en: "cbd", fr: "cbd", label: { en: "CBD", fr: "CBD" }, one: { en: "CBD product", fr: "produit CBD" } },
  seed: { en: "seeds", fr: "graines", label: { en: "Seeds", fr: "Graines" }, one: { en: "seed", fr: "graine" } },
  accessory: { en: "accessories", fr: "accessoires", label: { en: "Accessories", fr: "Accessoires" }, one: { en: "accessory", fr: "accessoire" } },
  other: { en: "other", fr: "autres", label: { en: "Topicals & other", fr: "Topiques et autres" }, one: { en: "product", fr: "produit" } },
};
export const CATEGORY_ORDER = ["flower", "edible", "concentrate", "vape", "cbd", "seed", "accessory", "other"];

const pre = (l: Lang) => (l === "en" ? "" : "/fr");
export const r = {
  home: (l: Lang) => `${pre(l)}/`,
  catalogue: (l: Lang) => `${pre(l)}/catalogue/`,
  category: (l: Lang, cat: string, page = 1) => `${pre(l)}/${CATEGORY_SLUGS[cat][l]}/${page > 1 ? `page/${page}/` : ""}`,
  product: (l: Lang, slug: string) => (l === "en" ? `/product/${slug}/` : `/fr/produit/${slug}/`),
  delivery: (l: Lang) => (l === "en" ? "/weed-delivery/" : "/fr/livraison-cannabis/"),
  province: (l: Lang, provSlug: string) => `${r.delivery(l)}${provSlug}/`,
  city: (l: Lang, provSlug: string, citySlug: string) => `${r.delivery(l)}${provSlug}/${citySlug}/`,
  shops: (l: Lang) => (l === "en" ? "/shops/" : "/fr/boutiques/"),
  shop: (l: Lang, slug: string) => `${r.shops(l)}${slug}/`,
  coupons: (l: Lang) => (l === "en" ? "/coupons/" : "/fr/codes-promo/"),
  coupon: (l: Lang, slug: string) => `${r.coupons(l)}${slug}/`,
  deals: (l: Lang) => (l === "en" ? "/deals/" : "/fr/promotions/"),
  about: (l: Lang) => (l === "en" ? "/about/" : "/fr/a-propos/"),
  legal: (l: Lang) => (l === "en" ? "/legal/" : "/fr/mentions-legales/"),
};

export const t = {
  en: {
    siteName: "Budboard",
    tagline: "Canada's mail-order cannabis catalogue, reprinted every week.",
    nav: { catalogue: "Catalogue", deals: "Deals", delivery: "Delivery by city", shops: "Shops", coupons: "Promo codes" },
    edition: (d: string) => `Weekly edition of ${d}`,
    editionShort: "Edition",
    searchLabel: "Search the catalogue",
    searchPlaceholder: "Search 3,000+ products: Pink Kush, gummies, shatter…",
    from: "from",
    shopsCount: (n: number) => (n === 1 ? "1 shop" : `${n} shops`),
    productsCount: (n: number) => (n === 1 ? "1 product" : `${n.toLocaleString("en-CA")} products`),
    compareN: (n: number) => (n === 1 ? "Sold by 1 shop" : `Compared across ${n} shops`),
    buyAt: (shop: string) => `Buy at ${shop}`,
    buyAtPrice: (shop: string, price: string) => `Buy at ${shop}, ${price}`,
    viewProduct: "View product",
    updated: (d: string) => `Prices checked ${d}`,
    disclosure: "Budboard earns a commission when you buy through links on this site. It never changes the price you pay.",
    imgNote: "Illustration. The product you receive may look different.",
    shopPhoto: (shop: string) => `Photo published by ${shop}.`,
    ageTitle: "Are you of legal age?",
    ageBody: "This catalogue is about cannabis. You must be 19 or older (18 in Alberta, 21 in Quebec) to enter.",
    ageYes: "I am of legal age",
    ageNo: "Leave",
    footerLegal: "Information only. In Canada, buying cannabis is legal only from retailers authorized by your province or territory. The online shops listed in this catalogue are not provincially licensed. Check your local rules before ordering.",
    langSwitch: "Français",
    noResults: "No products in stock here right now. Prices are checked every week.",
    breadcrumbHome: "Home",
    faqTitle: "Questions buyers ask",
    related: "From the same shelf",
    sortBy: "Sort by",
    sort: { popular: "Most compared", priceAsc: "Price, low to high", priceDesc: "Price, high to low", name: "Name, A to Z", discount: "Biggest price cut" },
    filterType: "Type",
    filterShop: "Shop",
    all: "All",
    typeLabel: { indica: "Indica", sativa: "Sativa", hybrid: "Hybrid" },
    showing: (a: number, b: number, n: number) => `Showing ${a} to ${b} of ${n.toLocaleString("en-CA")}`,
    prev: "Previous page",
    next: "Next page",
    page: (n: number) => `Page ${n}`,
  },
  fr: {
    siteName: "Budboard",
    tagline: "Le catalogue de vente par correspondance du cannabis au Canada, réédité chaque semaine.",
    nav: { catalogue: "Catalogue", deals: "Promotions", delivery: "Livraison par ville", shops: "Boutiques", coupons: "Codes promo" },
    edition: (d: string) => `Édition hebdomadaire du ${d}`,
    editionShort: "Édition",
    searchLabel: "Chercher dans le catalogue",
    searchPlaceholder: "Plus de 3 000 produits : Pink Kush, jujubes, shatter…",
    from: "dès",
    shopsCount: (n: number) => (n === 1 ? "1 boutique" : `${n} boutiques`),
    productsCount: (n: number) => (n === 1 ? "1 produit" : `${n.toLocaleString("fr-CA")} produits`),
    compareN: (n: number) => (n === 1 ? "Vendu par 1 boutique" : `Comparé dans ${n} boutiques`),
    buyAt: (shop: string) => `Acheter chez ${shop}`,
    buyAtPrice: (shop: string, price: string) => `Acheter chez ${shop}, ${price}`,
    viewProduct: "Voir le produit",
    updated: (d: string) => `Prix vérifiés le ${d}`,
    disclosure: "Budboard touche une commission quand vous achetez via les liens du site. Le prix que vous payez ne change pas.",
    imgNote: "Image d'illustration. Le produit reçu peut être différent.",
    shopPhoto: (shop: string) => `Photo publiée par ${shop}.`,
    ageTitle: "Avez-vous l'âge légal ?",
    ageBody: "Ce catalogue parle de cannabis. Il faut avoir 19 ans ou plus (18 ans en Alberta, 21 ans au Québec) pour entrer.",
    ageYes: "J'ai l'âge légal",
    ageNo: "Quitter",
    footerLegal: "Information seulement. Au Canada, l'achat de cannabis n'est légal qu'auprès des détaillants autorisés par votre province ou territoire. Les boutiques en ligne de ce catalogue ne détiennent pas de licence provinciale. Vérifiez les règles locales avant de commander.",
    langSwitch: "English",
    noResults: "Aucun produit en stock ici pour le moment. Les prix sont vérifiés chaque semaine.",
    breadcrumbHome: "Accueil",
    faqTitle: "Les questions des acheteurs",
    related: "Sur la même étagère",
    sortBy: "Trier par",
    sort: { popular: "Les plus comparés", priceAsc: "Prix croissant", priceDesc: "Prix décroissant", name: "Nom, de A à Z", discount: "Plus forte baisse" },
    filterType: "Type",
    filterShop: "Boutique",
    all: "Tous",
    typeLabel: { indica: "Indica", sativa: "Sativa", hybrid: "Hybride" },
    showing: (a: number, b: number, n: number) => `Produits ${a} à ${b} sur ${n.toLocaleString("fr-CA")}`,
    prev: "Page précédente",
    next: "Page suivante",
    page: (n: number) => `Page ${n}`,
  },
} as const;

export function fmtPrice(cents: number, l: Lang) {
  const v = cents / 100;
  return l === "en"
    ? `$${v.toLocaleString("en-CA", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
    : `${v.toLocaleString("fr-CA", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })} $`;
}

export function fmtDate(iso: string, l: Lang) {
  return new Date(iso).toLocaleDateString(l === "en" ? "en-CA" : "fr-CA", { day: "numeric", month: "long", year: "numeric" });
}

/** Date courte pour le cachet postal : « OCT 24 2026 » / « 24 OCT 2026 ». */
export function fmtStamp(iso: string, l: Lang) {
  const d = new Date(iso);
  const m = (l === "en" ? ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] : ["JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"])[d.getUTCMonth()];
  return l === "en" ? `${m} ${d.getUTCDate()} ${d.getUTCFullYear()}` : `${d.getUTCDate()} ${m} ${d.getUTCFullYear()}`;
}
