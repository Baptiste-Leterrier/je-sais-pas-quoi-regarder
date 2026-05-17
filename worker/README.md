# Proxy TMDB (Cloudflare Worker)

Proxy léger qui transmet les appels `/tmdb/*` à `https://api.themoviedb.org/3/*` en injectant le bearer TMDB côté serveur, pour ne pas exposer la clé dans le front statique.

## Configuration locale

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put TMDB_BEARER   # colle ton API Read Access Token (v4)
```

Mettre à jour `[vars].ALLOWED_ORIGINS` dans `wrangler.toml` avec l'origine GitHub Pages prod, séparée par virgules si plusieurs. Les origines `localhost:5173` / `127.0.0.1:5173` sont déjà autorisées.

## Déploiement

```bash
npx wrangler deploy
```

Note l'URL renvoyée (ex. `https://jpkr-tmdb.<your-subdomain>.workers.dev`) et place-la dans `VITE_TMDB_PROXY_URL` (front).

## Tester

```bash
curl "https://jpkr-tmdb.<sub>.workers.dev/tmdb/search/multi?query=matrix&language=fr-FR"
```
