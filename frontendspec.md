# VibeStream Frontend — Phase 1 Spec

Build the React client for VibeStream. The backend is complete and running; do
not modify anything in `server/`.

**Scope of this phase:** homepage, title details page, auth (login/signup), and
the shared shell (nav, routing, API client, card component). Search, watchlist
UI, reviews UI, and View All pages come in a later phase — but set up routing so
those routes can slot in without restructuring.

---

## Existing project state

```
vibestream/
├── client/          <- you work here (currently default Vite scaffold)
│   ├── src/App.jsx, main.jsx, App.css, index.css
│   ├── package.json (React 19.2.8, Vite 8.2.0)
│   └── vite.config.js
└── server/          <- do not modify
```

Server runs on port 3001. Vite dev server runs on 5173.

---

## Critical constraint: never call TMDB directly

The client must **only** call our own `/api/*` routes. Never call
`api.themoviedb.org` from the browser, and never put a TMDB token in client
code. This app exists specifically to fix a prior version that exposed a bearer
token client-side.

---

## Vite config

Add a dev proxy so `/api` requests reach the Express server and session cookies
work (they break cross-origin otherwise):

```js
server: {
  proxy: {
    '/api': 'http://localhost:3001',
  },
}
```

All fetches must use `credentials: 'include'` so the session cookie is sent.

---

## API reference

All responses are JSON. Auth-protected routes return 401 when logged out.

### Public

**`GET /api/vibes`** — the vibe manifest, in homepage row order.
```json
{ "vibes": [
  { "slug": "edge-of-your-seat", "name": "Edge of Your Seat",
    "description": "High-tension thrillers, mysteries, crime, and true crime.",
    "accent": "#ef4444" }
]}
```

**`GET /api/vibes/:slug`** — curated titles for one row (20–34 titles).
```json
{ "vibe": "guilty-pleasure", "titles": [
  { "tmdb_id": 9603, "media_type": "movie", "title": "Clueless",
    "poster_path": "/8AwV....jpg", "release_date": "1995-07-19",
    "overview": "Shallow, rich and socially successful Cher..." }
]}
```
Returns 404 for an unknown slug.

**`GET /api/discover/:slug?page=1`** — "View All" results (later phase).
Returns `{ vibe, page, total_pages, titles }`. Titles include `vote_average`.

**`GET /api/tmdb/:mediaType/:id`** — full TMDB details for one title. Raw TMDB
shape: `title`/`name`, `overview`, `poster_path`, `backdrop_path`, `runtime`
(movies) or `episode_run_time` (TV), `genres[]`, `vote_average`, `tagline`,
`release_date`/`first_air_date`.

**`GET /api/tmdb/:mediaType/:id/providers`** — streaming availability. Raw TMDB
shape: `{ id, results: { US: { link, flatrate: [{ provider_name, logo_path }], rent: [...], buy: [...] } } }`.
Many titles have no US entry — handle that.

**`GET /api/tmdb/search/multi?query=...&page=1`** — raw TMDB multi-search
(later phase).

### Auth

**`POST /api/auth/signup`** — body `{ email, password }`. Password must be ≥ 8
chars. Returns 201 `{ user: { id, email, created_at } }` and logs the user in.
Returns 409 if the email is taken, 400 for validation failures.

**`POST /api/auth/login`** — body `{ email, password }`. Returns
`{ user: { id, email } }` or 401 `{ error: "Invalid email or password" }`.

**`POST /api/auth/logout`** — returns `{ message }`.

**`GET /api/auth/me`** — returns `{ user }` or 401. Use on app mount to restore
session state.

### Protected (401 when logged out)

**`GET /api/watchlist`** — `{ titles: [...] }`, card shape, newest first.
**`POST /api/watchlist`** — body `{ tmdb_id, media_type }`. Returns 201. Adding
an existing title is a no-op, not an error.
**`DELETE /api/watchlist/:mediaType/:tmdbId`** — 204 on success, 404 if absent.

**`GET /api/reviews`** — `{ reviews: [...] }`.
**`GET /api/reviews/:mediaType/:tmdbId`** — `{ review }` or 404.
**`PUT /api/reviews/:mediaType/:tmdbId`** — body `{ text?, mood_tags?[] }`.
Creates or updates. Requires at least one of text or a non-empty tag array.
**`DELETE /api/reviews/:mediaType/:tmdbId`** — 204 or 404.

### Poster URLs

`poster_path` is a partial path. Build full URLs as:
`https://image.tmdb.org/t/p/w342{poster_path}` for cards,
`https://image.tmdb.org/t/p/w780{backdrop_path}` for hero/detail backdrops.
`poster_path` can be `null` — render a placeholder, never a broken image.

---

## Routing

Use React Router. Install it.

| Path | Page | Phase |
|---|---|---|
| `/` | Homepage (vibe rows) | 1 |
| `/title/:mediaType/:id` | Title details | 1 |
| `/login` | Login | 1 |
| `/signup` | Signup | 1 |
| `/vibe/:slug` | View All | later |
| `/search` | Search results | later |
| `/watchlist` | My List | later |

Unknown routes get a 404 page consistent with the design.

---

## Visual direction

Dark, cinematic, Peacock-inspired. A reference mockup exists; match it closely.

**Palette**
- Background: near-black obsidian (`#08070c`–`#0b0a10`), not pure black
- Elevated surfaces: `#141320`
- Primary text: `#f5f4f8`; secondary/muted: `#a09eb0`
- Brand violet: `#8b5cf6`; brand cyan: `#22d3ee`
- Per-vibe accents come from the API (`accent` field) — do not hardcode them

**Ambient glow.** The mockup's defining atmospheric element: a soft violet-to-
magenta nebula bleeding from the upper right of the hero, and faint colored
glow behind each poster row echoing that row's accent. Keep it subtle — it
should read as atmosphere, not as a visible gradient shape.

**Typography.** A geometric sans throughout. The wordmark is letter-spaced
uppercase with "VIBE" in white and "STREAM" in brand violet. The hero headline
is oversized, lowercase, tight leading, with the phrase "mood for?" in a
violet-to-pink gradient.

**Nav.** Fixed top bar: wordmark left; HOME / EXPLORE / SEARCH / MY LIST
centered in letter-spaced uppercase with an underline on the active item;
account icon right. Logged out, the account icon links to `/login`. Logged in,
it opens a small menu with the user's email and "Log out."

**Hero.** Headline "what are you / in the mood for?" over two lines,
subheadline "Skip the genres. Find something that fits the vibe." Left-aligned,
generous vertical space, nebula glow upper right.

**Vibe rows.** Each row: a short vertical accent bar in the vibe's color, the
name, then the description inline beside it in smaller muted text. Below, a
horizontally scrollable strip of portrait poster cards with tight gaps. A
circular arrow button on the right edge scrolls the strip; it should hide when
the strip is fully scrolled. Rows must also be scrollable by touch/trackpad and
navigable by keyboard.

**Cards.** Portrait posters, subtle rounded corners, no visible title text
overlay (posters carry their own titles). On hover: slight scale-up and a glow
in the row's accent color. Clicking navigates to `/title/:mediaType/:id`.

**Title details page.** Backdrop image with a heavy gradient scrim into the
page background; poster, title, year, runtime, genres, rating, tagline, and
overview. An "Add to My List" button (which, when logged out, routes to
`/login`). US streaming providers shown as logos when available. Leave clearly
marked space for the reviews UI coming in the next phase.

**Auth pages.** Single centered card on the dark background. Email and
password fields, a submit button, and a link to the other auth page. Show the
server's error message inline on failure. On success, route to `/`.

---

## Behavior notes

- Fetch `/api/auth/me` once on mount to restore session; hold user state in
  context so the nav and any protected UI can read it.
- Each homepage row's fetch triggers 20–34 TMDB calls server-side, so rows are
  slow. Fetch rows in parallel and show per-row skeleton placeholders rather
  than blocking the whole page on the slowest row.
- Empty and error states get real copy, not spinners that never resolve. If a
  row fails, that row says so; the rest of the page still works.
- Responsive down to mobile: rows stay horizontally scrollable, nav collapses.
- Visible keyboard focus everywhere. Respect `prefers-reduced-motion`.

---

## Out of scope for this phase

Do not build: search UI, watchlist page, reviews UI, View All pages. Do not
modify `server/`. Do not add a component library — plain CSS or CSS modules.