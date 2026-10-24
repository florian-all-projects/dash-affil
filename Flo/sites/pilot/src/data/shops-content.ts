// Présentation des boutiques : uniquement des faits observés (catalogue relevé par le scraper, data.csv).
// Pas d'avis inventés, pas de note, pas de témoignage. Les chiffres (produits, prix) sont calculés au build.
/** Nom court pour les boutons d'achat (évite les retours à la ligne). */
export const SHORT_NAME: Record<string, string> = {
  bmwo: "BMWO", getkush: "Get Kush", lowpricebud: "Low Price Bud", thehighclub: "High Club", chronicfarms: "Chronic Farms",
  cbdmagic: "CBD Magic", cbd2heal: "CBD2HEAL", cbd2go: "CBD2GO", ganjawest: "Ganja West", qcs: "QC Seeds", torontoseeds: "Toronto Seeds",
};

export const SHOP_INTRO: Record<string, { en: string; fr: string }> = {
  bmwo: {
    en: "Buy My Weed Online (BMWO) is one of the larger Canadian mail-order shops. Its catalogue mixes graded flower, pre-rolls, edibles, concentrates and CBD.",
    fr: "Buy My Weed Online (BMWO) est l'une des plus grandes boutiques canadiennes de vente par correspondance. Son catalogue mélange fleurs classées par grade, joints préroulés, comestibles, concentrés et CBD.",
  },
  getkush: {
    en: "Get Kush runs a large online menu with flower, edibles, concentrates and bundle deals where you pick several items at a fixed price.",
    fr: "Get Kush propose un grand menu en ligne : fleurs, comestibles, concentrés et lots où l'on choisit plusieurs articles à prix fixe.",
  },
  lowpricebud: {
    en: "Low Price Bud positions itself on budget pricing and carries one of the widest catalogues we track, from AAA flower to edibles.",
    fr: "Low Price Bud mise sur les petits prix et affiche l'un des catalogues les plus larges que nous suivons, des fleurs AAA aux comestibles.",
  },
  thehighclub: {
    en: "The High Club focuses on premium flower, with many strains sold in grades up to AAAA+ and small-bud options.",
    fr: "The High Club se concentre sur la fleur haut de gamme, avec de nombreuses variétés en grade AAAA+ et des options « smalls ».",
  },
  chronicfarms: {
    en: "Chronic Farms sells flower, edibles and concentrates by mail. We list only its cannabis and CBD products.",
    fr: "Chronic Farms vend fleurs, comestibles et concentrés par la poste. Nous ne listons que ses produits au cannabis et au CBD.",
  },
  cbdmagic: {
    en: "CBD Magic is a CBD specialist: oils, capsules, gummies, topicals and pet products, with no THC flower.",
    fr: "CBD Magic est spécialisée dans le CBD : huiles, capsules, jujubes, produits topiques et produits pour animaux, sans fleur au THC.",
  },
  cbd2heal: {
    en: "CBD2HEAL keeps a short CBD catalogue built around oils and topicals.",
    fr: "CBD2HEAL garde un catalogue CBD court, centré sur les huiles et les produits topiques.",
  },
  cbd2go: {
    en: "CBD2GO sells CBD oils, gummies, capsules and pet products, and runs regular promo codes by email.",
    fr: "CBD2GO vend huiles, jujubes, capsules au CBD et produits pour animaux, et envoie régulièrement des codes promo par courriel.",
  },
  ganjawest: {
    en: "Ganja West is a large mail-order dispensary with a wide concentrate and vape range, and several ways to pay.",
    fr: "Ganja West est une grande boutique de vente par correspondance, avec un large choix de concentrés et de vapoteuses et plusieurs moyens de paiement.",
  },
  qcs: {
    en: "Quebec Cannabis Seeds (QCS) is a seed bank based in Quebec that breeds feminized, autoflower, fast-version and CBD seeds for short northern seasons.",
    fr: "Quebec Cannabis Seeds (QCS) est une banque de graines québécoise qui sélectionne des graines féminisées, autofloraison, « fast version » et CBD pour les saisons courtes du Nord.",
  },
  torontoseeds: {
    en: "Toronto Cannabis Seeds is an Ontario seed bank selling feminized, autoflower and CBD seeds in packs of five.",
    fr: "Toronto Cannabis Seeds est une banque de graines ontarienne qui vend des graines féminisées, autofloraison et CBD en paquets de cinq.",
  },
};

/** Paiement et livraison : relevés sur les pages des shops le 24/10/2026 (accueil, FAQ). null = non publié ou non vérifié. */
export interface ShopFacts { payment: { en: string; fr: string } | null; shipping: { en: string; fr: string } | null; freeShipping: { en: string; fr: string } | null; source: string }
export const SHOP_FACTS: Record<string, ShopFacts> = {
  bmwo: {
    payment: { en: "Interac e-Transfer (the FAQ also mentions Visa and Mastercard). No PayPal.", fr: "Virement Interac (la FAQ mentionne aussi Visa et Mastercard). Pas de PayPal." },
    shipping: { en: "Canada Post Xpresspost, in discreet packaging.", fr: "Xpresspost de Postes Canada, emballage discret." },
    freeShipping: null,
    source: "https://buymyweedonline.cc/faq/",
  },
  getkush: {
    payment: null,
    shipping: { en: "Canada Post Xpresspost.", fr: "Xpresspost de Postes Canada." },
    freeShipping: { en: "Free shipping on orders over $129.", fr: "Livraison gratuite dès 129 $." },
    source: "https://getkush.cc/",
  },
  ganjawest: {
    payment: { en: "Interac e-Transfer, Bitcoin, USDT or credit card.", fr: "Virement Interac, Bitcoin, USDT ou carte de crédit." },
    shipping: { en: "Express shipping across Canada.", fr: "Envoi express partout au Canada." },
    freeShipping: null,
    source: "https://ganjawest.co/",
  },
  lowpricebud: {
    payment: null,
    shipping: { en: "Canada Post Xpresspost, insured, with a tracking number.", fr: "Xpresspost de Postes Canada, assuré, avec numéro de suivi." },
    freeShipping: { en: "Free shipping on orders over $150.", fr: "Livraison gratuite dès 150 $." },
    source: "https://lowpricebud.co/",
  },
  chronicfarms: {
    payment: { en: "Interac e-Transfer.", fr: "Virement Interac." },
    shipping: { en: "Express shipping to Canadian addresses only, flat $25 below the free-shipping threshold.", fr: "Envoi express vers des adresses canadiennes seulement, forfait de 25 $ sous le seuil de gratuité." },
    freeShipping: { en: "Free express shipping on orders over $150. No minimum order.", fr: "Livraison express gratuite dès 150 $. Pas de commande minimum." },
    source: "https://chronicfarms.cc/faq/",
  },
  qcs: {
    payment: null,
    shipping: { en: "Ships from Quebec within 24 hours of payment (Monday to Friday) by Canada Post, in plain packaging.", fr: "Expédié du Québec dans les 24 heures suivant le paiement (du lundi au vendredi) par Postes Canada, emballage neutre." },
    freeShipping: { en: "Free shipping on orders over $200.", fr: "Livraison gratuite dès 200 $." },
    source: "https://quebeccannabisseeds.com/",
  },
  torontoseeds: {
    payment: { en: "Interac e-Transfer, credit card or cash on delivery.", fr: "Virement Interac, carte de crédit ou paiement à la livraison." },
    shipping: { en: "Express (1 to 3 days) or regular (3 to 7 days) delivery.", fr: "Livraison express (1 à 3 jours) ou standard (3 à 7 jours)." },
    freeShipping: null,
    source: "https://torontocannabisseeds.com/",
  },
};
