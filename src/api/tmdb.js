const PROXY = import.meta.env.VITE_TMDB_PROXY_URL?.replace(/\/$/, '') || '';
const IMG_BASE = 'https://image.tmdb.org/t/p';

async function call(path, params = {}) {
  if (!PROXY) {
    throw new Error('VITE_TMDB_PROXY_URL est manquant. Configure le proxy Cloudflare Worker.');
  }
  const url = new URL(`${PROXY}/tmdb${path}`);
  url.searchParams.set('language', 'fr-FR');
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB ${res.status}`);
  }
  return res.json();
}

export function posterUrl(path, size = 'w500') {
  if (!path) return '';
  return `${IMG_BASE}/${size}${path}`;
}

function normalizeMovie(item) {
  return {
    id: item.id,
    type: 'movie',
    title: item.title || item.original_title || 'Sans titre',
    year: item.release_date ? Number(item.release_date.slice(0, 4)) : null,
    poster: posterUrl(item.poster_path, 'w500'),
    posterLarge: posterUrl(item.poster_path, 'w780'),
    backdrop: posterUrl(item.backdrop_path, 'w1280'),
    overview: item.overview || '',
    genreIds: item.genre_ids || [],
    voteAverage: item.vote_average ?? null,
  };
}

function normalizeTv(item) {
  return {
    id: item.id,
    type: 'tv',
    title: item.name || item.original_name || 'Sans titre',
    year: item.first_air_date ? Number(item.first_air_date.slice(0, 4)) : null,
    poster: posterUrl(item.poster_path, 'w500'),
    posterLarge: posterUrl(item.poster_path, 'w780'),
    backdrop: posterUrl(item.backdrop_path, 'w1280'),
    overview: item.overview || '',
    genreIds: item.genre_ids || [],
    voteAverage: item.vote_average ?? null,
  };
}

function normalizeMulti(item) {
  if (item.media_type === 'movie') return normalizeMovie(item);
  if (item.media_type === 'tv') return normalizeTv(item);
  return null;
}

export async function searchMulti(query) {
  if (!query.trim()) return [];
  const data = await call('/search/multi', { query, include_adult: false });
  return (data.results || [])
    .map(normalizeMulti)
    .filter(Boolean)
    .filter((m) => m.poster);
}

const genresCache = new Map();

export async function getGenres(type) {
  if (genresCache.has(type)) return genresCache.get(type);
  const data = await call(`/genre/${type}/list`);
  const list = data.genres || [];
  genresCache.set(type, list);
  return list;
}

export async function discover(type, filters) {
  const params = {
    include_adult: false,
    sort_by: 'popularity.desc',
    page: 1,
  };
  if (filters.genres?.length) params.with_genres = filters.genres.join(',');
  if (filters.yearGte) {
    if (type === 'movie') params['primary_release_date.gte'] = `${filters.yearGte}-01-01`;
    else params['first_air_date.gte'] = `${filters.yearGte}-01-01`;
  }
  if (filters.yearLte) {
    if (type === 'movie') params['primary_release_date.lte'] = `${filters.yearLte}-12-31`;
    else params['first_air_date.lte'] = `${filters.yearLte}-12-31`;
  }
  if (filters.keywordIds?.length) params.with_keywords = filters.keywordIds.join('|');

  const data = await call(`/discover/${type}`, params);
  const norm = type === 'movie' ? normalizeMovie : normalizeTv;
  return (data.results || []).map(norm).filter((m) => m.poster);
}

export async function searchKeyword(query) {
  if (!query.trim()) return [];
  const data = await call('/search/keyword', { query });
  return data.results || [];
}
