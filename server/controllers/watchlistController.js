import pool from '../db/pool.js';
import { fetchTmdbDetailsMany } from '../services/tmdb.js';

const VALID_MEDIA_TYPES = ['movie', 'tv'];

// GET /api/watchlist -- the logged-in user's saved titles, newest first
export async function getWatchlist(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT tmdb_id, media_type FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC',
      [req.session.userId]
    );

    const titles = await fetchTmdbDetailsMany(rows);

    res.json({ titles });
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
}

// POST /api/watchlist -- add a title
export async function addToWatchlist(req, res) {
  const { tmdb_id, media_type } = req.body;

  if (!tmdb_id || !media_type) {
    return res.status(400).json({ error: 'tmdb_id and media_type are required' });
  }

  if (!VALID_MEDIA_TYPES.includes(media_type)) {
    return res.status(400).json({ error: 'media_type must be "movie" or "tv"' });
  }

  if (!Number.isInteger(Number(tmdb_id))) {
    return res.status(400).json({ error: 'tmdb_id must be an integer' });
  }

  try {
    // ON CONFLICT DO NOTHING: re-adding an existing title is a no-op, not an
    // error -- a double-clicked save button shouldn't fail.
    await pool.query(
      `INSERT INTO watchlist (user_id, tmdb_id, media_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tmdb_id, media_type) DO NOTHING`,
      [req.session.userId, tmdb_id, media_type]
    );

    res.status(201).json({ tmdb_id: Number(tmdb_id), media_type });
  } catch (err) {
    console.error('Error adding to watchlist:', err);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
}

// DELETE /api/watchlist/:mediaType/:tmdbId -- remove a title
export async function removeFromWatchlist(req, res) {
  const { mediaType, tmdbId } = req.params;

  if (!VALID_MEDIA_TYPES.includes(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be "movie" or "tv"' });
  }

  try {
    // user_id in the WHERE clause scopes the delete to the current user --
    // guessing someone else's tmdb_id can't touch their rows.
    const result = await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND tmdb_id = $2 AND media_type = $3',
      [req.session.userId, tmdbId, mediaType]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Title not found in watchlist' });
    }

    res.status(204).end();
  } catch (err) {
    console.error('Error removing from watchlist:', err);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
}
