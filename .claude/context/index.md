# Contexte projet — Index (orchestrateur)

> **À lire au démarrage de CHAQUE session**, juste après `CLAUDE.md` (racine du repo).
> Ce dossier `.claude/context/` découpe le savoir du projet en modules.
> Ne charge PAS tout : selon la tâche demandée, ouvre uniquement les fichiers utiles (table ci-dessous).

## Hiérarchie des sources
1. `CLAUDE.md` (racine) = source de vérité opérationnelle (état, accès, procédures, protocole).
2. `JOURNAL.md` (racine) = historique daté des actions (survoler les dernières entrées).
3. `PLAN.md` (racine) = plan détaillé du réseau de sites marchands (Phase 2).
4. `.claude/context/*` = ce dossier, modules thématiques (ci-dessous).
5. `.claude/context/archive/` = anciens logs condensés (historique ancien uniquement).

## Modules disponibles
| Fichier | Contenu |
|---|---|
| `audience.md` | Cibles, personas, géo, langues, intentions de recherche, conformité âge |
| `brand-voice.md` | Voix éditoriale par site, FR/EN/ES, variation lexicale, règles YMYL, E-E-A-T |
| `design.md` | Principes de design des 10 sites (uniques), Astro, composants, perf |
| `seo.md` | Stratégie SEO : programmatique, maillage, schema, hreflang, anti-doorway, outils |
| `stack.md` | Architecture technique : scraper, PostgreSQL, dédup, génération, déploiement |
| `git.md` | Repo, déploiement, dashboard chiffré, secrets, protocole de doc |
| `progress.md` | Avancement réel (Phase 1 liens, Phase 2 planif), inputs en attente, next steps |
| `v1.md` | Définition du périmètre V1 / MVP et critères de réussite |

## Guide de chargement par tâche
| Tâche demandée | Charger |
|---|---|
| Toute session (systématique) | `CLAUDE.md` + cet index + survol `JOURNAL.md` |
| Scraper / base de données / pipeline | `stack.md`, `progress.md`, `git.md` |
| Créer / éditer un site (front) | `design.md`, `brand-voice.md`, `audience.md`, `stack.md` |
| Rédiger du contenu / des pages | `brand-voice.md`, `audience.md`, `seo.md` |
| SEO / maillage / schema / mots-clés | `seo.md`, `audience.md` |
| Déploiement / git / dashboard | `git.md` |
| Décider quoi faire / suivi | `progress.md`, `v1.md` |
| Définir / raffiner le V1 | `v1.md`, `progress.md`, `stack.md` |
| Plan global / vision Phase 2 | `PLAN.md` (racine) |

## Règle
Après toute action significative : journaliser dans `JOURNAL.md` (quoi + comment), mettre à jour le module concerné ici si besoin (ex. `progress.md`), et pousser. Voir `git.md`.
