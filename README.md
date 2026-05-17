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

Secrets à configurer dans le repo (`Settings → Secrets → Actions`) :
- `VITE_TMDB_PROXY_URL`
- `VITE_UMAMI_WEBSITE_ID`
- `VITE_UMAMI_SRC`

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

Évenements émis :
- `mode_started` : `{ mode: 'tournament' | 'discover' }`
- `candidate_added` : `{ id, type, total }`
- `tournament_started` : `{ count, types }`
- `duel_choice` : `{ round, choice: 'a' | 'b' | 'none' }`
- `tournament_completed` : `{ winner_id, winner_type, winner_year, total_candidates }`
- `tournament_restart` : `{ reason }`
- `tournament_to_discover` : `{ reason }`
- `discover_step` : `{ step, value }`
- `discover_completed` : `{ type, genres, era, has_keyword, suggested_id }`
- `discover_another` : `{ id }`
- `final_choice` : `{ id, type, year, source }`
