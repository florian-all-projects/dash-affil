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
  ganjawest: { en: "Ganja West is a mail-order shop we could not price-check yet.", fr: "Ganja West est une boutique en ligne dont nous n'avons pas encore pu relever les prix." },
  qcs: { en: "Quebec Cannabis Seeds is a Canadian seed bank.", fr: "Quebec Cannabis Seeds est une banque de graines québécoise." },
  torontoseeds: { en: "Toronto Cannabis Seeds is a Canadian seed bank.", fr: "Toronto Cannabis Seeds est une banque de graines canadienne." },
};
