const TMDB_BASE = 'https://api.themoviedb.org/3';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export default {
  async fetch(request, env) {
    const allowedOrigins = parseOrigins(env.ALLOWED_ORIGINS);
    const origin = request.headers.get('Origin');
    const isAllowed = !origin || allowedOrigins.includes(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, isAllowed),
      });
    }

    if (!isAllowed) {
      return new Response('Forbidden origin', { status: 403 });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith('/tmdb/')) {
      return new Response('Not found', { status: 404 });
    }

    if (!env.TMDB_BEARER) {
      return new Response('Missing TMDB_BEARER', { status: 500 });
    }

    const tmdbPath = url.pathname.replace(/^\/tmdb/, '');
    const tmdbUrl = new URL(`${TMDB_BASE}${tmdbPath}`);
    url.searchParams.forEach((v, k) => tmdbUrl.searchParams.set(k, v));

    const tmdbRes = await fetch(tmdbUrl.toString(), {
      headers: {
        Authorization: `Bearer ${env.TMDB_BEARER}`,
        Accept: 'application/json',
      },
    });

    const body = await tmdbRes.text();
    const headers = new Headers(corsHeaders(origin, isAllowed));
    headers.set('Content-Type', tmdbRes.headers.get('Content-Type') || 'application/json');
    headers.set('Cache-Control', 'public, max-age=300');

    return new Response(body, { status: tmdbRes.status, headers });
  },
};

function parseOrigins(raw) {
  const fromEnv = (raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED_ORIGINS, ...fromEnv];
}

function corsHeaders(origin, isAllowed) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  if (origin && isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}
