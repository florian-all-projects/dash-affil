// Langues, routes et libellés d'interface (EN par défaut à la racine, FR sous /fr/).
export type Lang = "en" | "fr";
export const LANGS: Lang[] = ["en", "fr"];

export const CATEGORY_SLUGS: Record<string, { en: string; fr: string; label: { en: string; fr: string } }> = {
  flower: { en: "flower", fr: "fleurs", label: { en: "Flower", fr: "Fleurs" } },
  edible: { en: "edibles", fr: "comestibles", label: { en: "Edibles", fr: "Comestibles" } },
  concentrate: { en: "concentrates", fr: "concentres", label: { en: "Concentrates", fr: "Concentrés" } },
  vape: { en: "vapes", fr: "vapoteuses", label: { en: "Vapes", fr: "Vapoteuses" } },
  cbd: { en: "cbd", fr: "cbd", label: { en: "CBD", fr: "CBD" } },
  seed: { en: "seeds", fr: "graines", label: { en: "Seeds", fr: "Graines" } },
  accessory: { en: "accessories", fr: "accessoires", label: { en: "Accessories", fr: "Accessoires" } },
  other: { en: "other", fr: "autres", label: { en: "Other", fr: "Autres" } },
};
export const CATEGORY_ORDER = ["flower", "edible", "concentrate", "vape", "cbd", "seed", "accessory", "other"];

const pre = (l: Lang) => (l === "en" ? "" : "/fr");
export const r = {
  home: (l: Lang) => `${pre(l)}/`,
  menu: (l: Lang) => (l === "en" ? "/menu/" : "/fr/menu/"),
  category: (l: Lang, cat: string, page = 1) =>
    `${r.menu(l)}${CATEGORY_SLUGS[cat][l]}/${page > 1 ? `page/${page}/` : ""}`,
  product: (l: Lang, slug: string) => `${pre(l)}/p/${slug}/`,
  city: (l: Lang, slug: string) => (l === "en" ? `/weed-delivery/${slug}/` : `/fr/livraison-cannabis/${slug}/`),
  cities: (l: Lang) => (l === "en" ? "/weed-delivery/" : "/fr/livraison-cannabis/"),
  province: (l: Lang, slugEn: string, slugFr: string) => (l === "en" ? `/is-weed-legal/${slugEn}/` : `/fr/legalite-cannabis/${slugFr}/`),
  shops: (l: Lang) => (l === "en" ? "/shops/" : "/fr/boutiques/"),
  shop: (l: Lang, slug: string) => `${r.shops(l)}${slug}/`,
  coupons: (l: Lang) => (l === "en" ? "/coupons/" : "/fr/codes-promo/"),
  coupon: (l: Lang, slug: string) => `${r.coupons(l)}${slug}/`,
  about: (l: Lang) => (l === "en" ? "/about/" : "/fr/a-propos/"),
  guide: (l: Lang) => (l === "en" ? "/guides/buy-weed-online/" : "/fr/guides/acheter-cannabis-en-ligne/"),
};

export const t = {
  en: {
    siteName: "Budboard",
    tagline: "Weed delivery prices across Canada, checked every week.",
    nav: { menu: "Menu", cities: "Delivery by city", shops: "Shops", coupons: "Promo codes", guide: "How to buy online" },
    from: "from",
    shopsCount: (n: number) => (n === 1 ? "1 shop" : `${n} shops`),
    productsCount: (n: number) => (n === 1 ? "1 product" : `${n} products`),
    buyAt: (shop: string) => `Buy at ${shop}`,
    buyAtPrice: (shop: string, price: string) => `Buy at ${shop}, ${price}`,
    seeOffer: "See offer",
    compare: "Compare prices",
    updated: (d: string) => `Prices checked ${d}`,
    disclosure: "Budboard earns a commission when you buy through links on this site. It never changes the price you pay.",
    imgNote: "Illustration. The product you receive may look different.",
    ageTitle: "Are you of legal age?",
    ageBody: "This site is about cannabis. You must be 19 or older (18 in Alberta, 21 in Quebec) to enter.",
    ageYes: "I am of legal age",
    ageNo: "Leave",
    footerLegal: "Information only. Buying cannabis is legal in Canada only from retailers authorized by your province or territory; the online shops listed here are not provincially licensed. Check your local rules.",
    langSwitch: "Français",
    noResults: "No products in stock in this category right now. Prices are checked every week.",
  },
  fr: {
    siteName: "Budboard",
    tagline: "Les prix de livraison de cannabis au Canada, vérifiés chaque semaine.",
    nav: { menu: "Menu", cities: "Livraison par ville", shops: "Boutiques", coupons: "Codes promo", guide: "Acheter en ligne" },
    from: "dès",
    shopsCount: (n: number) => (n === 1 ? "1 boutique" : `${n} boutiques`),
    productsCount: (n: number) => (n === 1 ? "1 produit" : `${n} produits`),
    buyAt: (shop: string) => `Acheter chez ${shop}`,
    buyAtPrice: (shop: string, price: string) => `Acheter chez ${shop}, ${price}`,
    seeOffer: "Voir l'offre",
    compare: "Comparer les prix",
    updated: (d: string) => `Prix vérifiés le ${d}`,
    disclosure: "Budboard touche une commission quand vous achetez via les liens du site. Le prix que vous payez ne change pas.",
    imgNote: "Image d'illustration. Le produit reçu peut être différent.",
    ageTitle: "Avez-vous l'âge légal ?",
    ageBody: "Ce site parle de cannabis. Il faut avoir 19 ans ou plus (18 ans en Alberta, 21 ans au Québec) pour entrer.",
    ageYes: "J'ai l'âge légal",
    ageNo: "Quitter",
    footerLegal: "Information seulement. Au Canada, l'achat de cannabis n'est légal qu'auprès des détaillants autorisés par votre province ou territoire ; les boutiques en ligne présentées ici ne détiennent pas de licence provinciale. Vérifiez les règles locales.",
    langSwitch: "English",
    noResults: "Aucun produit en stock dans cette catégorie pour le moment. Les prix sont vérifiés chaque semaine.",
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
