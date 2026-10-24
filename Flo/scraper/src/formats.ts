// Lecture des formats de vente publiés par les boutiques (attributs de variantes WooCommerce).
import { decodeEntities } from "./normalize";

/** « 3-5-grams », « 28 », « half-ounce », « 448g », « QP »… → grammes (null si ce n'est pas un poids). */
export function parseFormat(raw: string, attrName = ""): { grams: number | null; ml: number | null; mg: number | null; label: string } {
  const s = decodeEntities(raw).toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const name = attrName.toLowerCase();
  let grams: number | null = null, ml: number | null = null;
  let m: RegExpMatchArray | null;
  const mgm = s.match(/(\d+(?:[.,]\d+)?)\s*mg\b/);
  const mg = mgm ? Number(mgm[1].replace(",", ".")) : null;
  if ((m = s.match(/(\d+(?:[.,]\d+)?)\s*ml\b/))) ml = Number(m[1].replace(",", "."));
  // Fraction écrite en slug (« 1-4-lb » = 1/4 lb, « 1-8-oz » = 1/8 oz)
  else if ((m = s.match(/^(\d) ([248]) ?(lb|lbs|pound|pounds|oz|ounce|ounces)\b/))) grams = Math.round((/oz|ounce/.test(m[3]) ? 28 : 448) * Number(m[1]) / Number(m[2]) * 10) / 10;
  // Fractions d'once ou de livre (« 1/4 LB » = 112 g, « 1/2 oz » = 14 g) : à tester AVANT « lb » ou « oz » seuls
  else if ((m = s.match(/\b(\d)\s*\/\s*(\d+)\s*(lb|lbs|pound|pounds|oz|ounce|ounces)\b/))) grams = Math.round((/oz|ounce/.test(m[3]) ? 28 : 448) * Number(m[1]) / Number(m[2]) * 10) / 10;
  else if ((m = s.match(/\b(quarter|half)\s*(lb|lbs|pound|oz|ounce|o)\b/))) grams = (/oz|ounce|^o$/.test(m[2]) ? 28 : 448) * (m[1] === "half" ? 0.5 : 0.25);
  else if ((m = s.match(/^(\d+) (\d) ?(g|gr|gram|grams)\b/))) grams = Number(`${m[1]}.${m[2]}`); // « 3-5-grams »
  else if ((m = s.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|gram|grams|gms)\b/))) grams = Number(m[1].replace(",", "."));
  else if (/\b(quarter pound|qp)\b/.test(s)) grams = 112;
  else if (/\b(half pound|hp)\b/.test(s)) grams = 224;
  else if (/\b(full pound|pound|lb|lbs)\b/.test(s)) grams = 448;
  else if (/\b(half ounce|half oz|half o)\b/.test(s)) grams = 14;
  else if (/\b(quarter ounce|quarter oz|quarter)\b/.test(s)) grams = 7;
  else if (/\b(eighth|1\/8)\b/.test(s)) grams = 3.5;
  else if (/\b(ounce|oz)\b/.test(s)) grams = 28;
  else if (/^\d+(\.\d+)?$/.test(s) && /weight|gram|size|quantity|amount|format/.test(name)) grams = Number(s);
  else if ((m = s.match(/^(\d+) (\d)$/)) && /weight|gram|size|quantity|amount|format/.test(name)) grams = Number(`${m[1]}.${m[2]}`); // « 3-5 »
  const label = grams !== null ? `${grams} g` : ml !== null ? `${ml} ml` : decodeEntities(raw).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { grams, ml, mg, label };
}
