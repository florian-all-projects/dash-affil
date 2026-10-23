// Site pilote Budboard (Phase 2 Cana canada). 100 % statique, EN à la racine, FR sous /fr/.
// Hébergé sur Cloudflare Pages (classique) : adresse neutre budboard-ca.pages.dev tant que le NDD n'est pas branché.
// Ne PAS lancer « wrangler pages project create » sans --force : la version actuelle de Wrangler convertit le
// projet en Worker (adaptateur SSR + URL *.workers.dev qui affiche le sous-domaine du compte).
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: process.env.SITE_URL || "https://budboard-ca.pages.dev",
  trailingSlash: "always",
  build: { format: "directory" },
  vite: { plugins: [tailwindcss()] },
});
