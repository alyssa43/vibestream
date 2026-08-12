import { tmdbFetch } from '../services/tmdb.js';

function isValidMediaType(mediaType) {
  return mediaType === 'movie' || mediaType === 'tv';
}

// GET /api/tmdb/search/multi?query=... -- search movies, TV, and people at once
export async function searchMulti(req, res) {
  const { query, page } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Missing required "query" parameter' });
  }

  try {
    const data = await tmdbFetch('/search/multi', { query, page });
    res.json(data);
  } catch (err) {
    console.error('Error searching TMDB:', err);
    res.status(500).json({ error: 'Failed to search TMDB' });
  }
}

// GET /api/tmdb/:mediaType/:id -- movie or TV show details
export async function getDetails(req, res) {
  const { mediaType, id } = req.params;

  if (!isValidMediaType(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  try {
    const data = await tmdbFetch(`/${mediaType}/${id}`);
    res.json(data);
  } catch (err) {
    console.error(`Error fetching ${mediaType}/${id}:`, err);
    res.status(500).json({ error: 'Failed to fetch details' });
  }
}

// GET /api/tmdb/:mediaType/:id/providers -- watch providers (streaming availability)
export async function getProviders(req, res) {
  const { mediaType, id } = req.params;

  if (!isValidMediaType(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/watch/providers`);
    res.json(data);
  } catch (err) {
    console.error(`Error fetching providers for ${mediaType}/${id}:`, err);
    res.status(500).json({ error: 'Failed to fetch watch providers' });
  }
}
