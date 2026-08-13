const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const error = new Error(data?.error || `Request failed with status ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return data;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
const del = (path) => request(path, { method: 'DELETE' });

// Public
export const getVibes = () => get('/vibes');
export const getVibeRow = (slug) => get(`/vibes/${slug}`);
export const getDiscover = (slug, page = 1) => get(`/discover/${slug}?page=${page}`);
export const getTitleDetails = (mediaType, id) => get(`/tmdb/${mediaType}/${id}`);
export const getProviders = (mediaType, id) => get(`/tmdb/${mediaType}/${id}/providers`);
export const searchMulti = (query, page = 1) =>
  get(`/tmdb/search/multi?query=${encodeURIComponent(query)}&page=${page}`);

// Auth
export const signup = (email, password) => post('/auth/signup', { email, password });
export const login = (email, password) => post('/auth/login', { email, password });
export const logout = () => post('/auth/logout');
export const getMe = () => get('/auth/me');

// Watchlist (protected)
export const getWatchlist = () => get('/watchlist');
export const addToWatchlist = (tmdb_id, media_type) => post('/watchlist', { tmdb_id, media_type });
export const removeFromWatchlist = (mediaType, tmdbId) => del(`/watchlist/${mediaType}/${tmdbId}`);

// Reviews (protected)
export const getReviews = () => get('/reviews');
export const getReview = (mediaType, tmdbId) => get(`/reviews/${mediaType}/${tmdbId}`);
export const saveReview = (mediaType, tmdbId, body) => put(`/reviews/${mediaType}/${tmdbId}`, body);
export const deleteReview = (mediaType, tmdbId) => del(`/reviews/${mediaType}/${tmdbId}`);
