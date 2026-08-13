import pool from '../db/pool.js';
import vibes from '../config/vibes.js';

// GET /api/vibes/:slug -- curated homepage row for a given vibe
export async function getVibe(req, res) {
  const { slug } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT tmdb_id, media_type, title, poster_path, TO_CHAR(release_date, 'YYYY-MM-DD') AS release_date, vote_average
       FROM vibe_titles
       WHERE vibe_slug = $1
       ORDER BY sort_order`,
      [slug],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: `No titles found for vibe "${slug}"` });
    }

    // Rows added to a vibe before the backfill script has run for them will
    // have a null title. Drop those rather than serve a broken card; this
    // matches the existing accepted behavior where a row can render with
    // fewer titles than curated.
    const titles = rows
      .filter((row) => row.title !== null)
      .map((row) => ({
        tmdb_id: row.tmdb_id,
        media_type: row.media_type,
        title: row.title,
        poster_path: row.poster_path,
        release_date: row.release_date,
        vote_average: row.vote_average,
      }));

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
