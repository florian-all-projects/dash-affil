// Sélections (« listicles ») générées à partir des données : chaque sélection = un filtre + un classement + une mesure
// affichée, avec sa méthode écrite noir sur blanc. Aucune note subjective : on classe sur des chiffres relevés.
import type { Product } from "../lib/catalog";
import type { Lang } from "../lib/i18n";

export interface Collection {
  key: string; slug: { en: string; fr: string };
  h1: { en: string; fr: string }; title: { en: string; fr: string };
  intro: { en: string; fr: string }; method: { en: string; fr: string };
  filter: (p: Product) => boolean; rank: (a: Product, b: Product) => number;
  metric: (p: Product, lang: Lang, price: (c: number) => string) => string; metricLabel: { en: string; fr: string };
  min?: number;
}
const ppg = (a: Product, b: Product) => (a.ppg ?? 1e9) - (b.ppg ?? 1e9);
const ppgTxt = (p: Product, _l: Lang, price: (c: number) => string) => (p.ppg ? `${price(p.ppg)}/g` : price(p.from));
const thcTxt = (p: Product) => (p.thc ? `${p.thc[1]} %` : "-");
const oz = (p: Product) => p.formats.find((f) => f.grams === 28);
const isBud = (p: Product) => p.category === "flower" && !["shake", "preroll", "bulk"].includes(p.subtype);
const per10 = (p: Product) => (p.mgTotal ? p.from / (p.mgTotal / 10) : 1e9);

export const COLLECTIONS: Collection[] = [
  {
    key: "cheapest-per-gram", slug: { en: "cheapest-weed-per-gram", fr: "fleurs-moins-cheres-au-gramme" },
    h1: { en: "Cheapest Weed per Gram in Canada This Week", fr: "Les fleurs les moins chères au gramme cette semaine" },
    title: { en: "Cheapest Weed per Gram in Canada: This Week's Ranking", fr: "Cannabis le moins cher au gramme au Canada : le classement" },
    intro: { en: "Flower ranked by the lowest price per gram we found, across every weight each shop sells. Shake and pre-rolls are left out so you compare buds with buds.", fr: "Les fleurs classées par le prix au gramme le plus bas relevé, tous formats de poids confondus. Le shake et les préroulés sont exclus pour comparer des cocottes entre elles." },
    method: { en: "For each product we take every weight the shop sells, divide the price by the grams, and keep the lowest result. Ties are broken by the number of shops that sell the product.", fr: "Pour chaque produit, on prend chaque poids vendu par la boutique, on divise le prix par le nombre de grammes et on garde le résultat le plus bas. En cas d'égalité, le produit vendu par le plus de boutiques passe devant." },
    filter: (p) => isBud(p) && !!p.ppg, rank: (a, b) => ppg(a, b) || b.shopCount - a.shopCount, metric: ppgTxt, metricLabel: { en: "Best price per gram", fr: "Meilleur prix au gramme" },
  },
  {
    key: "cheap-ounces", slug: { en: "cheap-ounces-canada", fr: "once-de-cannabis-pas-chere" },
    h1: { en: "Cheap Ounces of Weed in Canada", fr: "Onces de cannabis pas chères au Canada" },
    title: { en: "Cheap Ounces Canada: Lowest Ounce Prices This Week", fr: "Once de cannabis pas chère : les prix les plus bas" },
    intro: { en: "Every flower sold by the ounce (28 g), ranked by the ounce price. Shake is excluded.", fr: "Toutes les fleurs vendues à l'once (28 g), classées par prix de l'once. Le shake est exclu." },
    method: { en: "We read the 28 g option on each product page and rank by its price. Products without a 28 g option are not listed.", fr: "On lit l'option 28 g sur la fiche de chaque produit et on classe par son prix. Les produits sans option 28 g ne sont pas listés." },
    filter: (p) => isBud(p) && !!oz(p), rank: (a, b) => oz(a)!.best - oz(b)!.best, metric: (p, _l, price) => price(oz(p)!.best), metricLabel: { en: "Ounce price", fr: "Prix de l'once" },
  },
  {
    key: "high-thc", slug: { en: "high-thc-weed", fr: "cannabis-fort-en-thc" },
    h1: { en: "High-THC Weed: Strains Above 25% THC", fr: "Cannabis fort en THC : les variétés à plus de 25 %" },
    title: { en: "High-THC Weed in Canada: Strains Above 25% THC", fr: "Cannabis fort en THC : variétés à plus de 25 %" },
    intro: { en: "Flower whose shop lists 25% THC or more, strongest first. THC is the shop's figure, not a lab test of the batch you receive.", fr: "Les fleurs pour lesquelles la boutique indique 25 % de THC ou plus, les plus fortes d'abord. Le THC est le chiffre de la boutique, pas une analyse du lot reçu." },
    method: { en: "We read the THC percentage published on the product page and keep the highest figure when a range is given.", fr: "On lit le pourcentage de THC publié sur la fiche produit et on garde le chiffre le plus haut quand une fourchette est donnée." },
    filter: (p) => p.category === "flower" && (p.thc?.[1] ?? 0) >= 25, rank: (a, b) => b.thc![1] - a.thc![1] || a.from - b.from, metric: (p) => thcTxt(p), metricLabel: { en: "THC listed", fr: "THC indiqué" },
  },
  {
    key: "indica", slug: { en: "indica-strains", fr: "varietes-indica" },
    h1: { en: "Indica Strains: The Best-Priced in Canada", fr: "Variétés indica : les mieux placées en prix au Canada" },
    title: { en: "Indica Strains Canada: Best Prices per Gram", fr: "Variétés indica : les meilleurs prix au gramme" },
    intro: { en: "Flower listed as indica by the shop, ranked by price per gram.", fr: "Les fleurs classées indica par la boutique, rangées par prix au gramme." },
    method: { en: "Type as published by the shop. Ranking by lowest price per gram across all weights.", fr: "Type tel que publié par la boutique. Classement par prix au gramme le plus bas, tous poids confondus." },
    filter: (p) => isBud(p) && p.strainType === "indica" && !!p.ppg, rank: ppg, metric: ppgTxt, metricLabel: { en: "Best price per gram", fr: "Meilleur prix au gramme" },
  },
  {
    key: "sativa", slug: { en: "sativa-strains", fr: "varietes-sativa" },
    h1: { en: "Sativa Strains: The Best-Priced in Canada", fr: "Variétés sativa : les mieux placées en prix au Canada" },
    title: { en: "Sativa Strains Canada: Best Prices per Gram", fr: "Variétés sativa : les meilleurs prix au gramme" },
    intro: { en: "Flower listed as sativa by the shop, ranked by price per gram.", fr: "Les fleurs classées sativa par la boutique, rangées par prix au gramme." },
    method: { en: "Type as published by the shop. Ranking by lowest price per gram across all weights.", fr: "Type tel que publié par la boutique. Classement par prix au gramme le plus bas, tous poids confondus." },
    filter: (p) => isBud(p) && p.strainType === "sativa" && !!p.ppg, rank: ppg, metric: ppgTxt, metricLabel: { en: "Best price per gram", fr: "Meilleur prix au gramme" },
  },
  {
    key: "hybrid", slug: { en: "hybrid-strains", fr: "varietes-hybrides" },
    h1: { en: "Hybrid Strains: The Best-Priced in Canada", fr: "Variétés hybrides : les mieux placées en prix au Canada" },
    title: { en: "Hybrid Strains Canada: Best Prices per Gram", fr: "Variétés hybrides : les meilleurs prix au gramme" },
    intro: { en: "Flower listed as hybrid by the shop, ranked by price per gram.", fr: "Les fleurs classées hybrides par la boutique, rangées par prix au gramme." },
    method: { en: "Type as published by the shop. Ranking by lowest price per gram across all weights.", fr: "Type tel que publié par la boutique. Classement par prix au gramme le plus bas, tous poids confondus." },
    filter: (p) => isBud(p) && p.strainType === "hybrid" && !!p.ppg, rank: ppg, metric: ppgTxt, metricLabel: { en: "Best price per gram", fr: "Meilleur prix au gramme" },
  },
  {
    key: "aaaa", slug: { en: "aaaa-weed", fr: "cannabis-aaaa" },
    h1: { en: "AAAA Weed: Top-Grade Flower Compared", fr: "Cannabis AAAA : les fleurs haut de gamme comparées" },
    title: { en: "AAAA Weed Canada: Top-Grade Flower, Best Prices", fr: "Cannabis AAAA : fleurs haut de gamme, meilleurs prix" },
    intro: { en: "Flower graded AAAA or higher by the shop, ranked by price per gram. Grades are set by each shop, not by an independent body.", fr: "Les fleurs notées AAAA ou plus par la boutique, classées par prix au gramme. Le grade est fixé par chaque boutique, pas par un organisme indépendant." },
    method: { en: "Grade read in the product name or description (AAAA, AAAA+, AAAAA). Ranking by lowest price per gram.", fr: "Grade lu dans le nom ou la description du produit (AAAA, AAAA+, AAAAA). Classement par prix au gramme le plus bas." },
    filter: (p) => isBud(p) && /^AAAA/.test(p.grade ?? ""), rank: (a, b) => ppg(a, b) || a.from - b.from, metric: ppgTxt, metricLabel: { en: "Best price per gram", fr: "Meilleur prix au gramme" },
  },
  {
    key: "pre-rolls", slug: { en: "pre-rolls", fr: "preroules" },
    h1: { en: "Pre-Rolls: Prices Compared in Canada", fr: "Préroulés : les prix comparés au Canada" },
    title: { en: "Pre-Rolls Canada: Prices Compared This Week", fr: "Préroulés au Canada : prix comparés cette semaine" },
    intro: { en: "Pre-rolled joints and packs, cheapest first.", fr: "Joints préroulés et paquets, les moins chers d'abord." },
    method: { en: "Products whose name says pre-roll, joint or cone. Ranking by lowest listed price.", fr: "Produits dont le nom indique préroulé, joint ou cône. Classement par prix le plus bas." },
    filter: (p) => p.category === "flower" && p.subtype === "preroll", rank: (a, b) => a.from - b.from, metric: (p, _l, price) => price(p.from), metricLabel: { en: "Lowest price", fr: "Prix le plus bas" },
  },
  {
    key: "gummies", slug: { en: "thc-gummies", fr: "jujubes-thc" },
    h1: { en: "THC Gummies: Price per 10 mg Compared", fr: "Jujubes au THC : le prix par 10 mg comparé" },
    title: { en: "THC Gummies Canada: Best Price per 10 mg", fr: "Jujubes au THC : le meilleur prix par 10 mg" },
    intro: { en: "Gummies ranked by what 10 mg of THC costs, the fair way to compare packs of different strengths.", fr: "Les jujubes classés selon le prix de 10 mg de THC, la bonne façon de comparer des paquets de dosages différents." },
    method: { en: "We read the total THC in the product name (for example 500 mg) and divide the lowest price by the number of 10 mg servings.", fr: "On lit le THC total dans le nom du produit (par exemple 500 mg) et on divise le prix le plus bas par le nombre de portions de 10 mg." },
    filter: (p) => p.category === "edible" && p.subtype === "gummies" && !!p.mgTotal, rank: (a, b) => per10(a) - per10(b), metric: (p, _l, price) => `${price(Math.round(per10(p)))} / 10 mg`, metricLabel: { en: "Price per 10 mg", fr: "Prix par 10 mg" },
  },
  {
    key: "disposables", slug: { en: "disposable-vapes", fr: "vapoteuses-jetables" },
    h1: { en: "THC Disposable Vapes Compared", fr: "Vapoteuses jetables au THC comparées" },
    title: { en: "THC Disposable Vape Pens Canada: Prices Compared", fr: "Vapoteuses jetables au THC : prix comparés" },
    intro: { en: "Disposable vape pens ranked by price per gram of oil when the size is listed, otherwise by price.", fr: "Les stylos jetables classés par prix au gramme d'huile quand la contenance est indiquée, sinon par prix." },
    method: { en: "Size read in the name (1 g, 2 g). Ranking by price per gram, then by price.", fr: "Contenance lue dans le nom (1 g, 2 g). Classement par prix au gramme, puis par prix." },
    filter: (p) => p.category === "vape" && p.subtype === "disposable", rank: (a, b) => ppg(a, b) || a.from - b.from, metric: ppgTxt, metricLabel: { en: "Price per gram", fr: "Prix au gramme" },
  },
  {
    key: "shatter", slug: { en: "shatter", fr: "shatter" },
    h1: { en: "Shatter: Price per Gram Compared in Canada", fr: "Shatter : le prix au gramme comparé au Canada" },
    title: { en: "Buy Shatter Online in Canada: Price per Gram", fr: "Acheter du shatter en ligne : prix au gramme" },
    intro: { en: "Shatter ranked by price per gram across every weight sold.", fr: "Le shatter classé par prix au gramme, tous formats confondus." },
    method: { en: "Products named shatter. Lowest price per gram across all weights.", fr: "Produits nommés shatter. Prix au gramme le plus bas, tous poids confondus." },
    filter: (p) => p.category === "concentrate" && p.subtype === "shatter", rank: (a, b) => ppg(a, b) || a.from - b.from, metric: ppgTxt, metricLabel: { en: "Best price per gram", fr: "Meilleur prix au gramme" },
  },
  {
    key: "autoflower", slug: { en: "autoflower-seeds", fr: "graines-autofloraison" },
    h1: { en: "Autoflower Seeds: Prices Compared in Canada", fr: "Graines autofloraison : les prix comparés au Canada" },
    title: { en: "Autoflower Seeds Canada: Prices Compared", fr: "Graines autofloraison au Canada : prix comparés" },
    intro: { en: "Autoflowering seeds from Canadian seed banks, cheapest pack first.", fr: "Graines autofloraison des banques de graines canadiennes, le paquet le moins cher d'abord." },
    method: { en: "Products named autoflower or auto. Ranking by lowest listed price.", fr: "Produits nommés autoflower ou auto. Classement par prix le plus bas." },
    filter: (p) => p.category === "seed" && p.subtype === "autoflower", rank: (a, b) => a.from - b.from, metric: (p, _l, price) => price(p.from), metricLabel: { en: "Lowest price", fr: "Prix le plus bas" },
  },
  {
    key: "feminized", slug: { en: "feminized-seeds", fr: "graines-feminisees" },
    h1: { en: "Feminized Seeds: Prices Compared in Canada", fr: "Graines féminisées : les prix comparés au Canada" },
    title: { en: "Feminized Seeds Canada: Prices Compared", fr: "Graines féminisées au Canada : prix comparés" },
    intro: { en: "Feminized photoperiod seeds, cheapest pack first.", fr: "Graines féminisées photopériodiques, le paquet le moins cher d'abord." },
    method: { en: "Products named feminized and not autoflower. Ranking by lowest listed price.", fr: "Produits nommés féminisés, hors autofloraison. Classement par prix le plus bas." },
    filter: (p) => p.category === "seed" && p.subtype === "feminized", rank: (a, b) => a.from - b.from, metric: (p, _l, price) => price(p.from), metricLabel: { en: "Lowest price", fr: "Prix le plus bas" },
  },
];
