# CLAUDE.md

Context for Claude Code working in this repository.

## What this is

VibeStream: a movie and TV discovery app organized by emotional "vibes" instead
of genres. Launch School Capstone project. Express + PostgreSQL + MongoDB
backend, React + Vite frontend, TMDB as the external data source.

The backend is complete and tested. The frontend is being built out.

## Hard rules

**Never call TMDB from the client.** The browser must only hit our own `/api/*`
routes. No TMDB token may appear in client code, ever. This app exists
specifically to replace an earlier version that exposed a bearer token in
client side JavaScript. This is the single most important constraint in the
project.

**Never commit `.env`.** It is gitignored at `server/.gitignore:2`. It holds the
TMDB token and session secret.

**Do not reorder imports in `server.js`.** `import './env.js'` must stay first.
See "The dotenv trap" below.

## Architecture

Requests flow: `routes/` maps a URL to a handler, `controllers/` handles the
request and response, `services/` talks to external APIs, `db/` and `models/`
talk to the databases.

Route files should stay thin. If a route file contains business logic, that
logic belongs in a controller.

```
server/
├── config/
│   ├── vibes.js         Row display metadata (names, descriptions, colors, order)
│   └── vibeDiscover.js  Per-vibe TMDB discover query params
├── controllers/         Request handlers, named exports
├── db/                  pool.js (Postgres), mongo.js (Mongoose), schema, seeds
├── middleware/          requireAuth.js
├── models/              Review.js (Mongoose)
├── routes/              Thin URL mapping, default exports
├── services/tmdb.js     All TMDB HTTP calls go through here
├── env.js               dotenv loader, imported first in server.js
└── server.js            Entry point
```

## Conventions

- ES modules throughout. `"type": "module"` in `server/package.json`.
- Controllers use **named** exports; route files use **default** exports.
- Snake case for anything that touches the database or crosses the API
  boundary (`tmdb_id`, `media_type`, `created_at`). Camel case for local
  JavaScript variables and function names.
- Mongo documents use `created_at` and `updated_at`, renamed from Mongoose's
  camelCase defaults, so they match the Postgres column naming.
- `:mediaType` is always `'movie'` or `'tv'`, validated in the controller.

## The dotenv trap

This bit the project once and is worth understanding before touching imports.

ES module imports are evaluated before the importing file's own body runs. A
module that reads `process.env.SOMETHING` at load time will read `undefined` if
dotenv has not run yet, and the failure is silent until an API call returns 401.

The fix in place: `server/env.js` calls `dotenv.config()` and is imported first
in `server.js`. No other module calls `dotenv.config()`. Do not add
`dotenv.config()` calls elsewhere, and do not move that import.

`services/tmdb.js` also reads the token inside the request function rather than
at module scope, as a second layer of protection.

## Express route ordering

In `routes/tmdb.js`, `/search/multi` must stay registered above
`/:mediaType/:id`. Otherwise Express matches "search" as `:mediaType` and the
search route becomes unreachable. There is a comment marking this; keep it.

## Two databases

Postgres holds `users`, `watchlist`, `vibe_titles`, `session`. Fixed shape,
relational.

MongoDB holds reviews. The schema uses `strict: false` on purpose, so a review
document can carry fields that were never declared. That flexibility is the
entire reason MongoDB is in this project. Do not tighten the schema.

The databases are not linked. A review's `user_id` is a plain number pointing
at `users.id` in Postgres, enforced by nothing. Cross database joins are not
possible; the Express layer is the only connection between them.

## Deployed behind a reverse proxy

Production runs behind Nginx at `alyssaeaster.dev/vibestream`, which introduces
constraints that cannot reproduce locally:

**`app.set('trust proxy', 1)` in `server.js` is required, not optional.** Nginx
terminates SSL and forwards to Express over plain HTTP on localhost, so Express
sees an insecure connection. With `cookie.secure: true` (which `NODE_ENV=production`
turns on), express-session then refuses to send a session cookie at all, silently.
No error, no `Set-Cookie` header, login appears to succeed and every subsequent
request is unauthenticated. Trusting the proxy makes Express read
`X-Forwarded-Proto` instead.

**The client API base is derived from Vite's `base` config.** `src/api/client.js`
builds it from `import.meta.env.BASE_URL`, so requests go to `/api` in dev (caught
by the Vite proxy) and `/vibestream/api` in production. Never hardcode `/api`.

**React Router needs `basename="/vibestream"`** to match `base: '/vibestream/'`.
Note the trailing slash on one and not the other. `basename` only affects routing;
it has no effect on `fetch` calls.

**Nginx strips the subpath.** The `location /vibestream/api/` block proxies to
`http://localhost:3001/api/`, so Express routes need no knowledge of the subpath.

## TMDB gotchas

- Movies and TV have **separate ID spaces**. TMDB ID 1399 is both a movie and a
  different show. Any operation on a title needs `media_type` alongside
  `tmdb_id`. Every unique constraint and route in this project reflects that.
- Movie objects use `title` and `release_date`; TV objects use `name` and
  `first_air_date`. `services/tmdb.js` normalizes this into a shared card shape.
- Discover params differ by media type: `primary_release_date.gte` for movies,
  `first_air_date.gte` for TV.
- TV genre IDs are a collapsed set. Action(28) and Adventure(12) become Action &
  Adventure(10759). Sci-Fi(878) and Fantasy(14) become Sci-Fi & Fantasy(10765).
  **There is no Horror genre for TV.**
- `poster_path` and `backdrop_path` are partial paths, and can be null. Build
  URLs as `https://image.tmdb.org/t/p/w342{poster_path}`.
- TMDB caps discover pagination at page 500.

## Known technical debt, deliberately accepted

**Homepage rows used to fetch live from TMDB; this is now fixed.** `GET
/api/vibes/:slug` previously fired one TMDB call per title (20 to 34 requests
per row, 200+ per homepage load), which caused real 429s in production.
`title`, `poster_path`, `release_date`, and `vote_average` are now cached on
`vibe_titles` and backfilled via `server/db/backfill-vibe-titles.js`, which is
safe to rerun since it only touches rows where `title IS NULL`. `getVibe`
reads these columns directly and makes no TMDB calls. See
`server/db/migrations/001_vibe_titles_cache.sql`.

`release_date` is selected with `TO_CHAR(release_date, 'YYYY-MM-DD')` rather
than returned as a raw `DATE` column. `pg` parses `DATE` into a JS `Date`
object, and `JSON.stringify` converts that to UTC, which can shift the date by
a day depending on the server's timezone. Don't remove the `TO_CHAR` cast
without understanding why it's there.

Discover, search, and title details each still cost one or two live TMDB
calls per request. That's fine, this fix only addressed the curated rows.

**Rows can silently return fewer titles than expected.** For curated vibe
rows, this can now only happen if a title was added to `vibe_titles` and the
backfill script hasn't been rerun since, in which case `getVibe` filters out
its null `title` rather than erroring. For the watchlist
(`GET /api/watchlist`), which still calls TMDB live via `fetchTmdbDetailsMany`,
this happens the original way, a failed individual TMDB fetch is dropped with
no error signal. Both are expected behavior, not a client bug.

**Email enumeration is only half closed.** Login returns a deliberately vague
"Invalid email or password" for both wrong email and wrong password. Signup
still returns a distinct 409 for a taken email, so accounts remain probeable
through that route. This is the standard tradeoff, accepted knowingly: making
signup vague too would badly hurt the user experience.

**`AVN Awards` (TMDB ID 71932) is blocklisted** in
`controllers/discoverController.js`. TMDB's `include_adult` flag is unreliable
for TV and this entry surfaces in the Reality genre.

## Commands

```
cd server && node server.js       # API on 3001
cd client && npm run dev          # Vite on 5173, proxies /api to 3001

psql -d vibestream_dev            # Postgres shell
mongosh vibestream_dev            # Mongo shell
```

Scratch utilities in `server/db/` are meant to be edited and rerun, not
preserved: `lookup-titles.js` (TMDB ID lookup by title),
`lookup-keywords.js` (keyword ID lookup), `test-discover.js` (compare discover
query strategies). Their contents at any commit are an arbitrary snapshot.

## Testing

There is no test suite. Routes have been verified manually with curl. When
adding a route, verify it with curl before considering it done, including the
failure cases, not just the happy path.

Session dependent routes need a cookie jar:

```
curl -s -c cookies.txt -X POST localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"..."}'

curl -s -b cookies.txt localhost:3001/api/watchlist
```

## Working style

- Explain why something failed, not just what fixes it.
- When terminal output looks truncated or wrong, `cat` the file to see its
  actual state before diagnosing. Files have been silently truncated by editor
  and shell mishaps more than once in this project.
- Do not assume file locations. This repo is worked on from two different
  machines.
- When looking up ambiguous movie or show titles, common words, remakes, and
  franchises, flag the ambiguity before running the lookup, and always show the
  matched title and year for verification before writing it to a seed file.