// Données compactes et libellés du moteur de filtres (Explorer.astro + /data/*.json).
import type { Product } from "./catalog";
import { SHORT_NAME } from "../data/shops-content";
import type { Lang } from "./i18n";

/** Libellés des sous-types (« format » du produit), par catégorie. */
export const SUBTYPE_LABELS: Record<string, { en: string; fr: string }> = {
  buds: { en: "Buds", fr: "Cocottes" }, preroll: { en: "Pre-rolls", fr: "Préroulés" }, smalls: { en: "Smalls and popcorn", fr: "Petits cocos" },
  shake: { en: "Shake", fr: "Shake (brisures)" }, bulk: { en: "Bulk and ounce deals", fr: "Vrac et offres à l'once" }, craft: { en: "Craft", fr: "Artisanal" },
  gummies: { en: "Gummies", fr: "Jujubes" }, chocolate: { en: "Chocolate", fr: "Chocolat" }, drinks: { en: "Drinks", fr: "Boissons" },
  baked: { en: "Baked goods", fr: "Pâtisseries" }, capsules: { en: "Capsules", fr: "Capsules" }, candy: { en: "Candy", fr: "Bonbons" }, tincture: { en: "Tinctures", fr: "Teintures" },
  shatter: { en: "Shatter", fr: "Shatter" }, hash: { en: "Hash and kief", fr: "Haschich et kief" }, rosin: { en: "Rosin", fr: "Rosin" }, liveresin: { en: "Live resin", fr: "Résine vivante" },
  wax: { en: "Wax and budder", fr: "Cire et budder" }, diamonds: { en: "Diamonds and sauce", fr: "Diamants et sauce" }, oil: { en: "Oils and distillate", fr: "Huiles et distillat" }, caviar: { en: "Caviar and moon rocks", fr: "Caviar et moon rocks" },
  battery: { en: "Batteries", fr: "Batteries" }, disposable: { en: "Disposable pens", fr: "Stylos jetables" }, cartridge: { en: "Cartridges", fr: "Cartouches" }, pod: { en: "Pods", fr: "Capsules pod" }, liquid: { en: "Liquids", fr: "Liquides" },
  pet: { en: "For pets", fr: "Pour animaux" }, topical: { en: "Creams and balms", fr: "Crèmes et baumes" }, bath: { en: "Bath", fr: "Bain" }, isolate: { en: "Isolate", fr: "Isolat" }, vape: { en: "Vapes", fr: "Vapotage" }, flower: { en: "Hemp flower", fr: "Fleur de chanvre" },
  autoflower: { en: "Autoflower", fr: "Autofloraison" }, fast: { en: "Fast version", fr: "Version rapide" }, cbd: { en: "CBD strains", fr: "Variétés CBD" }, mix: { en: "Mix packs", fr: "Assortiments" }, regular: { en: "Regular", fr: "Régulières" }, feminized: { en: "Feminized", fr: "Féminisées" },
  papers: { en: "Papers and cones", fr: "Papiers et cônes" }, grinder: { en: "Grinders", fr: "Moulins" }, glass: { en: "Pipes and bongs", fr: "Pipes et bongs" }, storage: { en: "Storage", fr: "Rangement" }, lighter: { en: "Lighters", fr: "Briquets" }, vaporizer: { en: "Vaporizers", fr: "Vaporisateurs" },
  misc: { en: "Other", fr: "Autres" },
};
export const subtypeLabel = (k: string, l: Lang) => SUBTYPE_LABELS[k]?.[l] ?? k;

/** Enregistrement compact d'un produit pour le filtrage dans le navigateur (≈ 300 octets). */
export interface Rec {
  n: string; s: string; i: string; k: string; p: number; d: number; c: number; t: string | null; sh: string[]; u: string; b: string; bn: string;
  pp: number; ca: string; st: string; g: string | null; q: number | null; x: number | null; fm: number[]; f: string; w: string[];
}
export const toRec = (p: Product): Rec => ({
  n: p.name, s: p.slug, i: p.image.src, k: p.image.kind, p: p.from, d: p.discount, c: p.shopCount, t: p.strainType,
  sh: [...new Set(p.offers.map((o) => o.shop.slug))], u: p.primary.buyUrl, b: p.primary.shop.slug, bn: SHORT_NAME[p.primary.shop.slug] ?? p.primary.shop.name,
  pp: p.primary.price, ca: p.category, st: p.subtype, g: p.grade, q: p.ppg, x: p.thc?.[1] ?? null,
  fm: p.formats.map((f) => f.grams).filter((g) => [1, 3.5, 7, 14, 28, 56, 112, 224, 448].includes(g)), f: p.firstSeen.slice(0, 10), w: p.weights.slice(0, 3),
});
