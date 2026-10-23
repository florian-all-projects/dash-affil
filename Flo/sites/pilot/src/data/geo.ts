// Provinces, territoires et villes couvertes par le site pilote.
// Faits légaux : Wikipedia « Cannabis laws of Canada by province or territory » (vérifié le 23/10/2026)
// et Cannabis Act fédéral (30 g en public). À revérifier avant chaque mise à jour majeure.

export const LEGAL_SOURCE = "https://en.wikipedia.org/wiki/Cannabis_laws_of_Canada_by_province_or_territory";
export const LEGAL_VERIFIED = "2026-10-23";

export interface Province {
  code: string;
  slug: string;          // slug EN (/is-weed-legal/<slug>/)
  slugFr: string;        // slug FR (/fr/legalite-cannabis/<slug>/)
  name: string;
  nameFr: string;
  age: number;
  retailer: string;      // canal de vente légal en ligne (nom, tel que documenté)
  retailerFr: string;
  homeGrow: boolean;     // culture à domicile (4 plants max) autorisée
  publicUse: string;     // consommation dans l'espace public (EN)
  publicUseFr: string;
}

export const PROVINCES: Province[] = [
  { code: "AB", slug: "alberta", slugFr: "alberta", name: "Alberta", nameFr: "Alberta", age: 18,
    retailer: "the AGLC government online store and licensed private stores", retailerFr: "la boutique en ligne gouvernementale de l'AGLC et les magasins privés autorisés",
    homeGrow: true, publicUse: "allowed only where tobacco smoking is allowed, never in a vehicle", publicUseFr: "permise seulement là où l'on peut fumer du tabac, jamais en voiture" },
  { code: "BC", slug: "british-columbia", slugFr: "colombie-britannique", name: "British Columbia", nameFr: "Colombie-Britannique", age: 19,
    retailer: "BC Cannabis Stores (government) and licensed private stores", retailerFr: "BC Cannabis Stores (gouvernement) et les magasins privés autorisés",
    homeGrow: true, publicUse: "allowed where tobacco smoking is allowed, banned near playgrounds, schools and places used by children", publicUseFr: "permise là où l'on peut fumer du tabac, interdite près des aires de jeux, des écoles et des lieux fréquentés par les enfants" },
  { code: "MB", slug: "manitoba", slugFr: "manitoba", name: "Manitoba", nameFr: "Manitoba", age: 19,
    retailer: "licensed private retailers", retailerFr: "les détaillants privés autorisés",
    homeGrow: false, publicUse: "banned in public places", publicUseFr: "interdite dans les lieux publics" },
  { code: "NB", slug: "new-brunswick", slugFr: "nouveau-brunswick", name: "New Brunswick", nameFr: "Nouveau-Brunswick", age: 19,
    retailer: "Cannabis NB stores and its online shop", retailerFr: "les magasins Cannabis NB et leur boutique en ligne",
    homeGrow: true, publicUse: "banned in public places and vehicles", publicUseFr: "interdite dans les lieux publics et les véhicules" },
  { code: "NL", slug: "newfoundland-and-labrador", slugFr: "terre-neuve-et-labrador", name: "Newfoundland and Labrador", nameFr: "Terre-Neuve-et-Labrador", age: 19,
    retailer: "the NLC government online store and licensed stores", retailerFr: "la boutique en ligne gouvernementale de la NLC et les magasins autorisés",
    homeGrow: true, publicUse: "banned in public places and vehicles", publicUseFr: "interdite dans les lieux publics et les véhicules" },
  { code: "NS", slug: "nova-scotia", slugFr: "nouvelle-ecosse", name: "Nova Scotia", nameFr: "Nouvelle-Écosse", age: 19,
    retailer: "NSLC stores and the NSLC website", retailerFr: "les magasins NSLC et le site de la NSLC",
    homeGrow: true, publicUse: "allowed where tobacco smoking is allowed, never in a vehicle", publicUseFr: "permise là où l'on peut fumer du tabac, jamais en voiture" },
  { code: "NT", slug: "northwest-territories", slugFr: "territoires-du-nord-ouest", name: "Northwest Territories", nameFr: "Territoires du Nord-Ouest", age: 19,
    retailer: "the territorial government's online store, delivered by Canada Post", retailerFr: "la boutique en ligne du gouvernement territorial, livrée par Postes Canada",
    homeGrow: true, publicUse: "allowed on trails, roads and in parks when no public event is taking place", publicUseFr: "permise sur les sentiers, les routes et dans les parcs en dehors des événements publics" },
  { code: "NU", slug: "nunavut", slugFr: "nunavut", name: "Nunavut", nameFr: "Nunavut", age: 19,
    retailer: "the Nunavut Liquor and Cannabis Commission (online, by phone and through agents)", retailerFr: "la Commission des alcools et du cannabis du Nunavut (en ligne, par téléphone et par agents)",
    homeGrow: true, publicUse: "allowed where tobacco smoking is allowed, except vehicles and school, hospital and playground grounds", publicUseFr: "permise là où l'on peut fumer du tabac, sauf en voiture et sur les terrains d'écoles, d'hôpitaux et d'aires de jeux" },
  { code: "ON", slug: "ontario", slugFr: "ontario", name: "Ontario", nameFr: "Ontario", age: 19,
    retailer: "the Ontario Cannabis Store (ocs.ca) and licensed private stores", retailerFr: "l'Ontario Cannabis Store (ocs.ca) et les magasins privés autorisés",
    homeGrow: true, publicUse: "allowed where tobacco smoking is allowed, never in a vehicle", publicUseFr: "permise là où l'on peut fumer du tabac, jamais en voiture" },
  { code: "PE", slug: "prince-edward-island", slugFr: "ile-du-prince-edouard", name: "Prince Edward Island", nameFr: "Île-du-Prince-Édouard", age: 19,
    retailer: "PEI Cannabis stores and peicannabiscorp.com", retailerFr: "les magasins PEI Cannabis et peicannabiscorp.com",
    homeGrow: true, publicUse: "banned in public places, vehicles and boats", publicUseFr: "interdite dans les lieux publics, les véhicules et les bateaux" },
  { code: "QC", slug: "quebec", slugFr: "quebec", name: "Quebec", nameFr: "Québec", age: 21,
    retailer: "the SQDC (stores and sqdc.ca)", retailerFr: "la SQDC (succursales et sqdc.ca)",
    homeGrow: false, publicUse: "banned wherever tobacco smoking is banned, plus other listed places", publicUseFr: "interdite partout où le tabac est interdit, ainsi que dans d'autres lieux désignés" },
  { code: "SK", slug: "saskatchewan", slugFr: "saskatchewan", name: "Saskatchewan", nameFr: "Saskatchewan", age: 19,
    retailer: "licensed retailers", retailerFr: "les détaillants autorisés",
    homeGrow: true, publicUse: "banned in public places and vehicles", publicUseFr: "interdite dans les lieux publics et les véhicules" },
  { code: "YT", slug: "yukon", slugFr: "yukon", name: "Yukon", nameFr: "Yukon", age: 19,
    retailer: "Cannabis Yukon, run by the Yukon Liquor Corporation, and licensed stores", retailerFr: "Cannabis Yukon, géré par la Société des alcools du Yukon, et les magasins autorisés",
    homeGrow: true, publicUse: "banned in public places; cannabis must be in a closed container in vehicles", publicUseFr: "interdite dans les lieux publics ; en voiture, le cannabis doit rester dans un contenant fermé" },
];

export interface City {
  slug: string;   // identique EN/FR
  name: string;
  nameFr: string;
  province: string;
}

// Grandes villes + capitales de chaque province et territoire (couverture nationale)
export const CITIES: City[] = [
  { slug: "toronto", name: "Toronto", nameFr: "Toronto", province: "ON" },
  { slug: "montreal", name: "Montreal", nameFr: "Montréal", province: "QC" },
  { slug: "vancouver", name: "Vancouver", nameFr: "Vancouver", province: "BC" },
  { slug: "calgary", name: "Calgary", nameFr: "Calgary", province: "AB" },
  { slug: "edmonton", name: "Edmonton", nameFr: "Edmonton", province: "AB" },
  { slug: "ottawa", name: "Ottawa", nameFr: "Ottawa", province: "ON" },
  { slug: "winnipeg", name: "Winnipeg", nameFr: "Winnipeg", province: "MB" },
  { slug: "mississauga", name: "Mississauga", nameFr: "Mississauga", province: "ON" },
  { slug: "brampton", name: "Brampton", nameFr: "Brampton", province: "ON" },
  { slug: "hamilton", name: "Hamilton", nameFr: "Hamilton", province: "ON" },
  { slug: "surrey", name: "Surrey", nameFr: "Surrey", province: "BC" },
  { slug: "quebec-city", name: "Quebec City", nameFr: "Québec", province: "QC" },
  { slug: "halifax", name: "Halifax", nameFr: "Halifax", province: "NS" },
  { slug: "laval", name: "Laval", nameFr: "Laval", province: "QC" },
  { slug: "london", name: "London", nameFr: "London", province: "ON" },
  { slug: "markham", name: "Markham", nameFr: "Markham", province: "ON" },
  { slug: "vaughan", name: "Vaughan", nameFr: "Vaughan", province: "ON" },
  { slug: "gatineau", name: "Gatineau", nameFr: "Gatineau", province: "QC" },
  { slug: "saskatoon", name: "Saskatoon", nameFr: "Saskatoon", province: "SK" },
  { slug: "kitchener", name: "Kitchener", nameFr: "Kitchener", province: "ON" },
  { slug: "longueuil", name: "Longueuil", nameFr: "Longueuil", province: "QC" },
  { slug: "burnaby", name: "Burnaby", nameFr: "Burnaby", province: "BC" },
  { slug: "windsor", name: "Windsor", nameFr: "Windsor", province: "ON" },
  { slug: "regina", name: "Regina", nameFr: "Regina", province: "SK" },
  { slug: "richmond", name: "Richmond", nameFr: "Richmond", province: "BC" },
  { slug: "oakville", name: "Oakville", nameFr: "Oakville", province: "ON" },
  { slug: "burlington", name: "Burlington", nameFr: "Burlington", province: "ON" },
  { slug: "sherbrooke", name: "Sherbrooke", nameFr: "Sherbrooke", province: "QC" },
  { slug: "victoria", name: "Victoria", nameFr: "Victoria", province: "BC" },
  { slug: "kelowna", name: "Kelowna", nameFr: "Kelowna", province: "BC" },
  { slug: "barrie", name: "Barrie", nameFr: "Barrie", province: "ON" },
  { slug: "st-johns", name: "St. John's", nameFr: "St. John's", province: "NL" },
  { slug: "moncton", name: "Moncton", nameFr: "Moncton", province: "NB" },
  { slug: "fredericton", name: "Fredericton", nameFr: "Fredericton", province: "NB" },
  { slug: "charlottetown", name: "Charlottetown", nameFr: "Charlottetown", province: "PE" },
  { slug: "whitehorse", name: "Whitehorse", nameFr: "Whitehorse", province: "YT" },
  { slug: "yellowknife", name: "Yellowknife", nameFr: "Yellowknife", province: "NT" },
  { slug: "iqaluit", name: "Iqaluit", nameFr: "Iqaluit", province: "NU" },
];

export const provinceOf = (code: string) => PROVINCES.find((p) => p.code === code)!;
