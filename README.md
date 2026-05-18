# jecpaskoiregarder

Application web statique pour aider un couple à choisir un film ou une série à regarder ensemble. Deux modes :

1. **Tournoi** — chacun ajoute ses candidats, l'app organise des duels A vs B jusqu'au gagnant.
2. **Je sais pas quoi regarder** — quiz court (type / genre / époque / mot-clé) qui interroge TMDB et propose une idée.

Vanilla JS + Vite, données via API TMDB proxyfiée par un Cloudflare Worker, persistance LocalStorage, statistiques Umami, déploiement GitHub Pages.

## Démarrage

```bash
npm install
cp .env.example .env
# remplir VITE_TMDB_PROXY_URL avec l'URL du worker déployé
# remplir VITE_UMAMI_WEBSITE_ID et VITE_UMAMI_SRC si Umami branché
npm run dev
```

Le worker se trouve dans [worker/](worker/) (voir son README).

## Build

```bash
npm run build
npm run preview
```

## Déploiement

Push sur `main` → workflow GitHub Actions `Deploy to GitHub Pages` (voir `.github/workflows/deploy.yml`).

Variables à configurer dans le repo (`Settings → Secrets and variables → Actions → onglet Variables → New repository variable`) — pas en Secrets, car Vite inline ces valeurs dans le bundle client (elles ne sont pas confidentielles) :
- `VITE_TMDB_PROXY_URL`
- `VITE_UMAMI_WEBSITE_ID`
- `VITE_UMAMI_SRC`

La seule valeur réellement secrète (`TMDB_BEARER`) reste configurée côté Cloudflare Worker via `wrangler secret put`.

Activer Pages : `Settings → Pages → Build and deployment → Source = GitHub Actions`.

## Structure

```
src/
  api/tmdb.js          # client API via proxy worker
  state/store.js       # store pub/sub + persistance LocalStorage
  lib/tournament.js    # bracket : bye sur impair, élimination, tours
  screens/             # home, select, tournament, discover, result
  components/          # cartes film / duel / search bar
  analytics/umami.js   # wrapper Umami (no-op si non chargé)
  styles/              # reset, tokens, app
worker/                # Cloudflare Worker proxy TMDB
```

## Tracking Umami

Pour avoir des distributions exploitables dans Umami, les sélections multi-valeurs (genres, thèmes) sont émises atomiquement : un évenement par item sélectionné, avec le **nom** (pas l'ID).

Évenements émis :
- `mode_started` : `{ mode: 'tournament' | 'discover' }`
- `candidate_added` : `{ id, type, total }`
- `tournament_started` : `{ count, types }` (depuis `select`)
- `duel_choice` : `{ choice: 'a' | 'b' | 'none', via: 'click' | 'indifferent' | 'timeout' }`
- `tournament_completed` : `{ winner_id, winner_type, winner_year, winner_decade, total_candidates, flow }`
- `tournament_restart` : `{ reason }`
- `tournament_to_discover` : `{ reason }`
- `discover_step` : `{ step, count?, value? }`
- `discover_genre_selected` : `{ name }` — un event par genre choisi
- `discover_theme_selected` : `{ name }` — un event par thème choisi
- `discover_completed` : `{ type, era, genres_count, themes_count, pool_size }`
- `discover_relaunch` : `{ pool_size }`
- `final_choice` : `{ id, type, year, source: 'tournament' | 'discover' }`
