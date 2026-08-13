-- Adds cached TMDB display fields to vibe_titles so GET /api/vibes/:slug
-- can serve curated rows from Postgres instead of calling TMDB live.
-- Run once per database: MacBook Pro dev, iMac dev, VPS prod.

ALTER TABLE vibe_titles
  ADD COLUMN title VARCHAR(255),
  ADD COLUMN poster_path VARCHAR(255),
  ADD COLUMN release_date DATE,
  ADD COLUMN vote_average NUMERIC(3,1);
