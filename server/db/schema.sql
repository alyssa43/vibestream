CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, media_type)
);

CREATE TABLE vibe_titles (
  id SERIAL PRIMARY KEY,
  vibe_slug VARCHAR(50) NOT NULL,
  tmdb_id INTEGER NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  sort_order INTEGER NOT NULL,
  title VARCHAR(255),
  poster_path VARCHAR(255),
  release_date DATE,
  vote_average NUMERIC(3,1),
  UNIQUE(vibe_slug, tmdb_id, media_type)
);


-- Session store for connect-pg-simple (used by express-session)
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IDX_session_expire ON session (expire);
