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

# VibeStream Frontend — Phase 2 Spec

Builds on the completed phase 1 client. Reuse the existing components, context,
API client, and styling. Do not restructure what already works, and do not
modify anything in `server/`.

**Scope of this phase:** search, My List, reviews UI on the title details page,
View All pages, and the Explore page. After this phase the app is
feature complete and ready to deploy.

---

## Carried over from phase 1

These already exist and should be reused, not rebuilt:

- Auth context holding the current user, restored via `GET /api/auth/me`
- Watchlist held in that same context, giving instant membership checks
- The poster card component, with hover glow and click through to
  `/title/:mediaType/:id`
- The View All card at the end of each homepage row, currently linking to a
  `/vibe/:slug` placeholder that this phase replaces
- Placeholder pages at `/search`, `/watchlist`, `/explore`, and `/vibe/:slug`,
  all of which this phase replaces with real pages

Same hard rule as phase 1: **the client never calls TMDB directly.** Every
request goes through our own `/api/*` routes, and no TMDB token appears in
client code.

---

## 1. Search (`/search`)

**Endpoint:** `GET /api/tmdb/search/multi?query=...&page=1`

This is a raw TMDB passthrough, so the response is TMDB's shape, not our card
shape:

```json
{ "page": 1, "total_pages": 12, "total_results": 231,
  "results": [
    { "id": 9603, "media_type": "movie", "title": "Clueless",
      "poster_path": "/8AwV....jpg", "release_date": "1995-07-19",
      "overview": "...", "vote_average": 7.3 },
    { "id": 3921, "media_type": "tv", "name": "Clueless",
      "first_air_date": "1996-09-20", "...": "..." },
    { "id": 12345, "media_type": "person", "name": "Alicia Silverstone",
      "profile_path": "...", "known_for": [] }
  ]}
```

Three things to handle:

- **Filter out `media_type: "person"` results entirely.** People carry real
  data, but `/api/tmdb/:mediaType/:id` only accepts `movie` or `tv`, so a
  person card would have nowhere to click through to. Dropping them is
  deliberate for this phase.
- **Movies use `title`/`release_date`; TV uses `name`/`first_air_date`.**
  Normalize into the card shape the existing card component expects.
- `poster_path` can be null. Use the same placeholder treatment as elsewhere.

**Behavior.** Search input at the top of the page, debounced by roughly 300ms so
each keystroke does not fire a request. Put the query in the URL as
`?q=...` so a search is linkable and survives a refresh. Results in a poster
grid, same card component and grid as the View All page below. Paginate with a
"Load more" button, not infinite scroll.

**States.** Before any query, an empty state inviting a search. Zero results
after a query, a clear message naming the query. Requests in flight, skeleton
cards rather than a blocking spinner.

---

## 2. My List (`/watchlist`)

**Endpoint:** `GET /api/watchlist` returns `{ titles: [...] }` already in card
shape, newest first. Requires a session.

**Behavior.** Poster grid of saved titles. Each card gets a remove affordance
(a small button on hover, or an X in the corner) calling
`DELETE /api/watchlist/:mediaType/:tmdbId`, which returns 204. Remove the card
from the grid optimistically and restore it if the request fails.

Reuse the watchlist already in context rather than refetching on mount, and keep
context in sync when a title is removed, so the details page toggle stays
correct without a reload.

**States.** Logged out, redirect to `/login`. Empty list, an empty state that
points somewhere useful (a link back to the homepage), not just "nothing here."

---

## 3. Reviews UI (on `/title/:mediaType/:id`)

Replaces the "Reviews are coming in a later phase" placeholder.

**Endpoints:**

- `GET /api/reviews/:mediaType/:tmdbId` returns `{ review }`, or 404 if the
  user has not reviewed this title. A 404 here is a normal state, not an error
  to surface.
- `PUT /api/reviews/:mediaType/:tmdbId` with body `{ text, mood_tags }`.
  Creates or updates in one call. Requires at least one of a non-empty `text`
  or a non-empty `mood_tags` array, otherwise returns 400.
- `DELETE /api/reviews/:mediaType/:tmdbId` returns 204, or 404 if absent.

A review document looks like:

```json
{ "review": { "_id": "...", "user_id": 1, "tmdb_id": 9603,
              "media_type": "movie", "text": "...",
              "mood_tags": ["nostalgic", "comfort"],
              "created_at": "...", "updated_at": "..." }}
```

**The form.** A textarea for the review body, plus free-entry mood tags: type a
tag, press Enter or comma to commit it, each tag renders as a removable chip.
Tags are the user's own words, not a fixed list. Save button calls PUT.

Note that `mood_tags` replaces rather than merges on save, so the form must
submit the complete tag array, not just newly added ones.

**States.** Logged out, show a prompt to log in instead of the form. No review
yet, show an empty form or a "write a review" affordance. Review exists, show
it with edit and delete controls, prefilled on edit. Include the `updated_at`
date on a saved review.

---

## 4. View All (`/vibe/:slug`)

**Endpoint:** `GET /api/discover/:slug?page=1`

```json
{ "vibe": "edge-of-your-seat", "page": 1, "total_pages": 17,
  "titles": [ { "tmdb_id": 155, "media_type": "movie", "title": "...",
                "poster_path": "...", "release_date": "...",
                "overview": "...", "vote_average": 8.5 } ]}
```

Returns 404 for an unknown slug.

**Page header.** The vibe's name, description, and accent color are not in the
discover response. They come from `GET /api/vibes`, which the homepage already
fetches. Hold that manifest in context so this page can read from it rather than
refetching, and so a direct load of `/vibe/:slug` still works.

**Results per page vary by vibe, and that is expected:**

- Most vibes return 40 per page, 20 movies plus 20 TV
- Spooky & Eerie returns 20. It is movies only by design, because TMDB has no
  Horror genre for television
- Guilty Pleasure returns about 59. It fires two TV queries, adult animation and
  reality, and one blocklisted entry is filtered server side

Do not treat these differences as bugs or try to normalize them.

**Layout.** Poster grid, same card component as everywhere else. Movies come
before TV in the response; render in the order returned. Header carries the
accent color the way homepage rows do. "Load more" button, hidden once `page`
reaches `total_pages`. Append to the grid rather than replacing it.

---

## 5. Explore (`/explore`)

**Endpoint:** `GET /api/vibes`, the manifest already in context.

A grid of the 8 vibes as entry cards. Each card shows the vibe name and
description, uses its accent color, and links to `/vibe/:slug`. No TMDB data on
this page at all, so it should load instantly.

This is the browsable index of the whole app: the homepage shows curated picks
per vibe, and Explore is how someone gets to the full discovery page for a mood
without scrolling a row to its end.

---

## Cross cutting

- Reuse the existing card, grid, skeleton, and empty state patterns. If a
  pattern does not exist yet and is needed twice, extract it into a shared
  component rather than duplicating it.
- Every fetch keeps `credentials: 'include'`.
- Protected pages redirect to `/login` when logged out rather than rendering an
  error.
- Empty and error states get real copy that says what happened and what to do
  next.
- Responsive down to mobile. Grids reflow, no horizontal overflow.
- Visible keyboard focus. `prefers-reduced-motion` respected.
- Poster URLs stay `https://image.tmdb.org/t/p/w342{poster_path}`.

---

## Out of scope

Do not build: person search results, public or multi user reviews, provider
logo deduplication, or any changes to `server/`.