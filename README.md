# VibeStream

A movie and TV discovery app organized around emotional "vibes" rather than
traditional genres. Instead of browsing by Comedy or Horror, you browse by
mood: Edge of Your Seat, Guilty Pleasure, In My Feels, Spooky & Eerie.

Each vibe row on the homepage is hand curated, not algorithmic. Clicking
through to a vibe's full page runs a live TMDB discovery query tuned
specifically for that mood.

Built as a Launch School Capstone project.

## Stack

**Backend:** Node.js, Express (ES modules), PostgreSQL, MongoDB
**Frontend:** React, Vite
**Auth:** bcryptjs, express-session, connect-pg-simple
**External API:** TMDB

## Why two databases

PostgreSQL holds `users`, `watchlist`, `vibe_titles`, and `session`. Every row
in those tables has the same fixed shape, and the relationships between them
matter, so a relational database is the right fit.

MongoDB holds user reviews and notes. Review content genuinely varies in shape:
one user writes several paragraphs, another saves only a few mood tags, a third
tracks a rewatch count. The Review schema uses `strict: false`, so documents can
carry fields that were never declared. Modeling that in Postgres would mean a
wide table full of nulls.

The two databases are not linked. Postgres has no knowledge of MongoDB and
there are no cross database joins. A review document's `user_id` is a plain
number that the Express layer agrees to treat as a foreign key into
`users.id`. The tradeoff is explicit: shape flexibility in exchange for
referential integrity, since Postgres `ON DELETE CASCADE` cannot reach a
Mongo document.

## Project structure

```
vibestream/
├── client/                  React + Vite frontend
└── server/
    ├── config/
    │   ├── vibes.js         Row metadata: names, descriptions, accent colors, order
    │   └── vibeDiscover.js  Per-vibe TMDB discover query recipes
    ├── controllers/         Request handlers
    ├── db/
    │   ├── pool.js          Postgres connection pool
    │   ├── mongo.js         Mongoose connection
    │   ├── schema.sql       Postgres schema
    │   ├── seed-*.sql       One seed file per vibe (8 total, 181 titles)
    │   └── lookup-*.js      Scratch utilities for TMDB ID lookups
    ├── middleware/
    │   └── requireAuth.js   Session gate for protected routes
    ├── models/
    │   └── Review.js        Mongoose schema for reviews
    ├── routes/              URL to handler mapping
    ├── services/
    │   └── tmdb.js          TMDB API client
    ├── env.js               Loads .env. Imported first in server.js.
    └── server.js            Express entry point
```

## Local setup

Requires Node 20+, PostgreSQL, and MongoDB running locally.

### 1. Install dependencies

```
cd server && npm install
cd ../client && npm install
```

### 2. Create the Postgres database

```
createdb vibestream_dev
psql -d vibestream_dev -f server/db/schema.sql
```

### 3. Seed the curated vibe data

```
cd server
for f in db/seed-*.sql; do psql -d vibestream_dev -f "$f"; done
```

Verify all 8 vibes loaded (181 titles total):

```
psql -d vibestream_dev -c "SELECT vibe_slug, COUNT(*) FROM vibe_titles GROUP BY vibe_slug ORDER BY vibe_slug;"
```

### 4. Create `server/.env`

MongoDB creates its database on first write, so there is nothing to set up
there beyond having it running.

```
TMDB_TOKEN=your_tmdb_read_access_token
PORT=3001
POSTGRES_URL=postgresql://youruser@localhost:5432/vibestream_dev
MONGO_URL=mongodb://localhost:27017/vibestream_dev
SESSION_SECRET=generate_a_random_64_char_hex_string
NODE_ENV=development
```

Generate a session secret with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`TMDB_TOKEN` is the API Read Access Token from your TMDB account settings, not
the shorter v3 API key.

### 5. Run

```
cd server && node server.js     # port 3001
cd client && npm run dev        # port 5173
```

## API

### Public

| Method | Route | Description |
|---|---|---|
| GET | `/api/vibes` | Vibe manifest: names, descriptions, accent colors, row order |
| GET | `/api/vibes/:slug` | Curated titles for one vibe row |
| GET | `/api/discover/:slug?page=1` | Live TMDB discovery results for a vibe |
| GET | `/api/tmdb/search/multi?query=` | TMDB multi search passthrough |
| GET | `/api/tmdb/:mediaType/:id` | Title details passthrough |
| GET | `/api/tmdb/:mediaType/:id/providers` | Streaming availability passthrough |
| GET | `/api/health` | Health check |

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account and log in |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Current user, 401 if logged out |

### Protected

All require a valid session.

| Method | Route | Description |
|---|---|---|
| GET | `/api/watchlist` | Current user's saved titles |
| POST | `/api/watchlist` | Add a title |
| DELETE | `/api/watchlist/:mediaType/:tmdbId` | Remove a title |
| GET | `/api/reviews` | Current user's reviews |
| GET | `/api/reviews/:mediaType/:tmdbId` | Review for one title |
| PUT | `/api/reviews/:mediaType/:tmdbId` | Create or update a review |
| DELETE | `/api/reviews/:mediaType/:tmdbId` | Delete a review |

`:mediaType` is always `movie` or `tv`. TMDB numbers movies and TV shows in
separate ID spaces, so `tmdb_id` alone does not uniquely identify a title.

## The vibe discover configs

`server/config/vibeDiscover.js` holds a hand tuned TMDB discovery query for
each vibe. They are hand tuned because TMDB genres are categories and vibes are
moods, so the mapping is lossy. Several vibes share a genre: Guilty Pleasure,
Brain Off Comfort On, and part of Warm & Fuzzy are all Comedy.

What the levers do:

- Comma in `with_genres` means AND, pipe means OR.
- `vote_count.gte` keeps out brand new releases carrying provisional ratings
  from small vote counts.
- A date ceiling is also needed when sorting by popularity, because TMDB
  popularity is recency weighted and otherwise floods results with unreleased
  titles.
- `vote_average.lte`, a rating ceiling, is what makes the comfort vibes work. A
  guilty pleasure is by definition not critically acclaimed, so sorting by
  "best" returns the opposite of what the vibe means.
- Date ranges separate vibes that share a genre. Guilty Pleasure is Comedy plus
  Romance restricted to 1990 through 2009, which captures the nostalgia the
  curation is built on.
- `with_original_language: 'en'` is required on every TV query. Without it,
  TMDB's TV ratings skew so heavily toward anime that every list becomes an
  anime leaderboard.

Known limits, both structural rather than tuning problems:

- **Spooky & Eerie is movies only.** TMDB has no Horror genre for television.
  Mystery, Mystery plus Drama, Crime plus Mystery, and Crime plus Sci-Fi were
  all tested and returned detective procedurals and teen supernatural drama
  instead of horror.
- **Guilty Pleasure fires two TV queries** and merges them: adult animation
  (Animation plus Comedy, excluding Kids) and reality (excluding Talk). No
  single TMDB genre captures the vibe.

TMDB keywords were evaluated and rejected. Coverage is too sparse and the
vocabulary is unnormalized, with separate keyword entries for "time loop",
"time loops", and "timeloop". A keyword filtered mind benders query returned 13
results against 126 for the genre equivalent.

## Deployment

Deploys to a DigitalOcean droplet (Ubuntu 24.04) at
`alyssaeaster.dev/vibestream`, behind Nginx with Let's Encrypt SSL, running
under PM2 alongside a separate portfolio site.

Production differences from local:

- `NODE_ENV=production`, which flips the session cookie to HTTPS only
- A distinct `SESSION_SECRET`
- A `POSTGRES_URL` with a real password, since the VPS Postgres is not
  trust based
- Vite built with `base: '/vibestream/'` for subpath routing