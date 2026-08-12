import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_TOKEN = process.env.TMDB_TOKEN;

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, value);
  });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// GET /api/tmdb/search/multi?query=... -- search movies, TV, and people at once
router.get('/search/multi', async (req, res) => {
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
});

// GET /api/tmdb/:mediaType/:id -- movie or TV show details
router.get('/:mediaType/:id', async (req, res) => {
  const { mediaType, id } = req.params;

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  try {
    const data = await tmdbFetch(`/${mediaType}/${id}`);
    res.json(data);
  } catch (err) {
    console.error(`Error fetching ${mediaType}/${id}:`, err);
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});

// GET /api/tmdb/:mediaType/:id/providers -- watch providers (streaming availability)
router.get('/:mediaType/:id/providers', async (req, res) => {
  const { mediaType, id } = req.params;

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  try {
    const data = await tmdbFetch(`/${mediaType}/${id}/watch/providers`);
    res.json(data);
  } catch (err) {
    console.error(`Error fetching providers for ${mediaType}/${id}:`, err);
    res.status(500).json({ error: 'Failed to fetch watch providers' });
  }
});

export default router;