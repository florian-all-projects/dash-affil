// Guides d'achat : sujet, mots-clés visés, graphiques calculés à partir du catalogue (toujours à jour) et sources citées.
// Le texte est généré par scripts/gen-guides.ts en blocs structurés (repères, tableaux, étapes, comparatifs…), pas en pavés.
export interface GuideDef {
  key: string; slug: { en: string; fr: string }; keyword: { en: string; fr: string };
  brief: string; charts: string[]; sources: Array<{ name: string; url: string }>;
}
export const GUIDES: GuideDef[] = [
  {
    key: "weights", slug: { en: "weed-weights-and-prices", fr: "poids-et-prix-du-cannabis" },
    keyword: { en: "weed weights and prices Canada (gram, eighth, quarter, half, ounce)", fr: "poids du cannabis et prix (gramme, huitième, quart, demi-once, once)" },
    brief: "Explain cannabis weights (1 g, 3.5 g eighth, 7 g quarter, 14 g half ounce, 28 g ounce, quarter pound 112 g, half pound, pound 448 g), slang names in Canada, and how price per gram falls with bigger bags. Include a conversion table block, a keyfacts block, the chart ppg_by_weight, a checklist for comparing deals fairly (price per gram, shake vs buds, shipping thresholds).",
    charts: ["ppg_by_weight"],
    sources: [{ name: "Government of Canada, Cannabis Act possession limits", url: "https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations/regulations-support-cannabis-act.html" }],
  },
  {
    key: "grades", slug: { en: "cannabis-grades-explained", fr: "grades-du-cannabis-expliques" },
    keyword: { en: "AAAA weed meaning, cannabis grades explained", fr: "cannabis AAAA signification, grades du cannabis" },
    brief: "Explain the AA / AAA / AAAA / AAAAA grading used by Canadian online shops: it is a shop-defined marketing scale, no official standard; what shops usually mean (bud structure, trichomes, smell, cure); how to judge quality yourself (checklist). Use charts count_by_grade and ppg_by_grade. A table describing each grade as shops usually present it, with a note that it is not standardized.",
    charts: ["count_by_grade", "ppg_by_grade"],
    sources: [],
  },
  {
    key: "types", slug: { en: "indica-vs-sativa-vs-hybrid", fr: "indica-sativa-ou-hybride" },
    keyword: { en: "indica vs sativa vs hybrid", fr: "indica ou sativa ou hybride différence" },
    brief: "Explain indica, sativa and hybrid labels: botanical origin, how shops use the labels, and that research shows the label does not reliably predict effects (chemical profile, THC/CBD and terpenes matter more). No health claims. Compare block with 3 columns. Charts: type_share, thc_by_type, ppg_by_type.",
    charts: ["type_share", "thc_by_type", "ppg_by_type"],
    sources: [],
  },
  {
    key: "edibles", slug: { en: "edibles-dosage-guide", fr: "guide-dosage-comestibles" },
    keyword: { en: "edibles dosage guide Canada, how many mg edible", fr: "dosage comestible cannabis, combien de mg" },
    brief: "Edibles dosing for adults, based ONLY on the CCSA and Health Canada guidance given in FACTS: start low (2.5 mg THC or less), wait (effects can take 30 minutes to 2 hours, peak around 4 hours, last up to 12 hours, residual up to 24 hours), do not mix with alcohol, keep away from children and pets, the legal-market package limit of 10 mg THC per package versus multi-hundred-mg products sold by online shops. Steps block (how to dose a first time). Table of how to split a gummy pack into 10 mg servings (example: 500 mg pack = 50 servings). Chart per10mg_by_subtype. Callout warn about accidental ingestion and calling Poison Control.",
    charts: ["per10mg_by_subtype"],
    sources: [
      { name: "CCSA, 7 Things You Need to Know About Edible Cannabis", url: "https://www.ccsa.ca/sites/default/files/2019-06/CCSA-7-Things-About-Edible-Cannabis-2019-en.pdf" },
      { name: "Health Canada, Edible cannabis", url: "https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/resources/edible-cannabis.html" },
    ],
  },
  {
    key: "seeds", slug: { en: "autoflower-vs-feminized-seeds", fr: "graines-autofloraison-ou-feminisees" },
    keyword: { en: "autoflower vs feminized seeds", fr: "graines autofloraison ou féminisées" },
    brief: "Compare autoflower, feminized photoperiod, regular and fast-version seeds: how flowering is triggered, timeline, plant size, beginner friendliness, yields in general terms (no invented numbers). Compare block with columns. Table: where home growing is allowed (provinces from FACTS: up to 4 plants per household; not allowed in Quebec). Charts: seed_price_by_subtype, province_homegrow.",
    charts: ["seed_price_by_subtype", "province_homegrow"],
    sources: [
      { name: "Government of Canada, Growing cannabis at home", url: "https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/personal-use/growing-cannabis-home-safely.html" },
      { name: "Gouvernement du Québec, Cadre légal du cannabis", url: "https://www.quebec.ca/sante/conseils-et-prevention/alcool-drogues-jeu/connaitre-les-drogues-et-leurs-effets/cannabis/encadrement-cannabis-quebec/cadre-legal-cannabis-bref" },
      { name: "Government of Manitoba, Grow at home", url: "https://gov.mb.ca/cannabis/knowthelaw/growathome.html" },
    ],
  },
  {
    key: "laws", slug: { en: "cannabis-laws-by-province", fr: "lois-sur-le-cannabis-par-province" },
    keyword: { en: "cannabis laws by province Canada (legal age, possession, home grow)", fr: "lois sur le cannabis par province (âge légal, possession, culture)" },
    brief: "Province-by-province rules: legal age, public possession (30 g federal limit), home growing, where to buy legally (the provincial channel), public consumption. The full table is rendered by the site from FACTS (chart province_rules): your blocks should explain how to read it, the federal baseline, the exceptions (Quebec 21 and no home growing, Alberta 18), travelling between provinces and the ban on crossing the border with cannabis. Clearly state that the online shops in this catalogue are not provincially licensed.",
    charts: ["province_rules"],
    sources: [
      { name: "Government of Canada, Cannabis laws and regulations", url: "https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/laws-regulations.html" },
      { name: "Gouvernement du Québec, Cadre légal du cannabis", url: "https://www.quebec.ca/sante/conseils-et-prevention/alcool-drogues-jeu/connaitre-les-drogues-et-leurs-effets/cannabis/encadrement-cannabis-quebec/cadre-legal-cannabis-bref" },
      { name: "Government of Manitoba, Grow at home", url: "https://gov.mb.ca/cannabis/knowthelaw/growathome.html" },
    ],
  },
  {
    key: "ordering", slug: { en: "how-mail-order-weed-works", fr: "comment-fonctionne-la-vente-par-correspondance" },
    keyword: { en: "how to order weed online in Canada (mail order)", fr: "comment commander du cannabis en ligne au Canada" },
    brief: "How mail-order cannabis shops work, factually: browsing a catalogue, minimum orders and free-shipping thresholds, payment methods the shops in FACTS publish (Interac e-Transfer, crypto, cards where listed), shipping (Canada Post Xpresspost when listed), tracking, packaging. Steps block for the process. Checklist of things to verify before paying (published terms, contact, reviews on independent forums, prices consistent with the market). Callout info: these shops are not provincially licensed, the legal channel is provincial. Chart: free_shipping_by_shop and the table payment_by_shop rendered by the site.",
    charts: ["free_shipping_by_shop", "payment_by_shop"],
    sources: [],
  },
];
