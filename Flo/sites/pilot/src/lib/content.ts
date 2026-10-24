// Contenus éditoriaux des pages (catégories, provinces, villes, boutiques), générés par Flo/gen/page-content.mjs,
// stockés dans D1 (table content) et exportés dans src/data/generated/content-pages.json.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Lang } from "./i18n";

export interface PageText { title?: string; meta?: string; lead: string; sections: Array<{ h: string; p: string[] }>; faq: Array<{ q: string; a: string }> }
const path = join(process.cwd(), "src", "data", "generated", "content-pages.json");
const all: Record<string, Record<string, PageText>> = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};

/** Contenu d'une page : type (category | province | city | shop | home) + clé (ex. « flower », « ON », « ON/toronto », « bmwo »). */
export function pageContent(type: string, key: string, lang: Lang): PageText | null {
  return all[`${type}:${key}`]?.[lang] ?? null;
}

export interface GuideText { key: string; title: string; meta: string; h1: string; lead: string; blocks: any[]; faq: Array<{ q: string; a: string }> }
/** Guide (blocs structurés générés par scripts/gen-guides.ts). */
export function guideContent(key: string, lang: Lang): GuideText | null {
  return (all[`guide:${key}`]?.[lang] as unknown as GuideText) ?? null;
}
