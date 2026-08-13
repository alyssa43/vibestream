import pool from '../db/pool.js';
import vibes from '../config/vibes.js'
import { fetchTmdbDetailsMany } from '../services/tmdb.js';

// GET /api/vibes/:slug -- curated homepage row for a given vibe
export async function getVibe(req, res) {
  const { slug } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT tmdb_id, media_type FROM vibe_titles WHERE vibe_slug = $1 ORDER BY sort_order',
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `No titles found for vibe "${slug}"` });
    }

    const titles = await fetchTmdbDetailsMany(rows);

    res.json({ vibe: slug, titles });
  } catch (err) {
    console.error(`Error fetching vibe "${slug}":`, err);
    res.status(500).json({ error: 'Failed to fetch vibe titles' });
  }
}

// GET /api/vibes -- the vibe manifest (names, descriptions, colors, row order)
export function listVibes(req, res) {
  res.json({ vibes });
}