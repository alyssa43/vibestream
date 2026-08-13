// Backfills cached TMDB display fields (title, poster_path, release_date,
// vote_average) into vibe_titles, so GET /api/vibes/:slug can be served
// straight from Postgres instead of calling TMDB live.
//
// Safe to rerun: only touches rows where title IS NULL. If you add new
// curated titles to a vibe later, rerunning this picks up just the new rows.
//
// Usage: cd server && node db/backfill-vibe-titles.js

import '../env.js';
import pool from './pool.js';
import { fetchTmdbDetails } from '../services/tmdb.js';

const DELAY_MS = 300; // spacing between TMDB requests, avoids 429s

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const { rows } = await pool.query(
    'SELECT id, tmdb_id, media_type FROM vibe_titles WHERE title IS NULL ORDER BY id'
  );

  if (rows.length === 0) {
    console.log('Nothing to backfill, every row already has cached details.');
    await pool.end();
    return;
  }

  console.log(`Backfilling ${rows.length} row(s)...`);

  let succeeded = 0;
  let failed = 0;

  for (const row of rows) {
    const details = await fetchTmdbDetails(row.tmdb_id, row.media_type);

    if (details === null) {
      failed += 1;
      console.error(`  [skip] id ${row.id} (${row.media_type}/${row.tmdb_id})`);
      await sleep(DELAY_MS);
      continue;
    }

    await pool.query(
      `UPDATE vibe_titles
       SET title = $1, poster_path = $2, release_date = $3, vote_average = $4
       WHERE id = $5`,
      [details.title, details.poster_path, details.release_date, details.vote_average, row.id]
    );

    succeeded += 1;
    console.log(`  [ok] id ${row.id} -> ${details.title}`);

    await sleep(DELAY_MS);
  }

  console.log(`Done. ${succeeded} succeeded, ${failed} failed.`);
  if (failed > 0) {
    console.log('Rerun this script to retry the failed rows.');
  }

  await pool.end();
}

run();
