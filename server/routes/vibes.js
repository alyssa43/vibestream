import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_TOKEN = process.env.TMDB_TOKEN;

async function fetchTmdbDetails(tmdbId, mediaType) {
  const url = `${TMDB_BASE}/${mediaType}/${tmdbId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
  });

  if (!res.ok) {
    console.error(`TMDB fetch failed for ${mediaType}/${tmdbId}: ${res.status}`);
    return null;
  }

  const data = await res.json();

  return {
    tmdb_id: data.id,
    media_type: mediaType,
    title: data.title || data.name,
    poster_path: data.poster_path,
    release_date: data.release_date || data.first_air_date,
    overview: data.overview,
  };
}

// GET /api/vibes/:slug -- curated homepage row for a given vibe
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT tmdb_id, media_type FROM vibe_titles WHERE vibe_slug = $1 ORDER BY sort_order',
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `No titles found for vibe "${slug}"` });
    }

    const titles = await Promise.all(
      rows.map((row) => fetchTmdbDetails(row.tmdb_id, row.media_type))
    );

    // Filter out any titles that failed to fetch from TMDB
    const validTitles = titles.filter((t) => t !== null);

    res.json({ vibe: slug, titles: validTitles });
  } catch (err) {
    console.error(`Error fetching vibe "${slug}":`, err);
    res.status(500).json({ error: 'Failed to fetch vibe titles' });
  }
});

export default router;