import vibeDiscover from '../config/vibeDiscover.js';
import { tmdbFetch } from '../services/tmdb.js';

// TMDB's include_adult flag is unreliable for TV, so a small blocklist catches
// what slips through. Match on exact tmdb_id, not title -- titles collide.
const BLOCKED_TMDB_IDS = new Set([
  71932, // AVN Awards (adult film awards) -- surfaces in the Reality genre
]);

function filterTitles(titles) {
  const seen = new Set();

  return titles.filter((item) => {
    const key = `${item.media_type}:${item.tmdb_id}`;
    if (BLOCKED_TMDB_IDS.has(item.tmdb_id)) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Normalize a TMDB discover result into the same card shape the vibes and
// watchlist routes return, so the frontend renders one component everywhere.
function toCard(item, mediaType) {
  return {
    tmdb_id: item.id,
    media_type: mediaType,
    title: item.title || item.name,
    poster_path: item.poster_path,
    release_date: item.release_date || item.first_air_date,
    overview: item.overview,
    vote_average: item.vote_average,
  };
}

// A vibe's movie/tv config may be a single param set or an array of them.
// Guilty Pleasure needs two TV queries (adult animation + reality) because no
// single TMDB genre captures the vibe.
function toParamSets(config) {
  if (!config) return [];
  return Array.isArray(config) ? config : [config];
}

async function discoverFor(mediaType, config, page) {
  const paramSets = toParamSets(config);

  const responses = await Promise.all(
    paramSets.map((params) =>
      tmdbFetch(`/discover/${mediaType}`, { ...params, page })
    )
  );

  const results = responses.flatMap((res) =>
    res.results.map((item) => toCard(item, mediaType))
  );

  // With multiple param sets, report the largest total_pages so the frontend
  // keeps paginating until every underlying query is exhausted.
  const totalPages = Math.max(...responses.map((res) => res.total_pages));

  return { results, totalPages };
}

// GET /api/discover/:slug?page=1 -- "View All" results for a vibe
export async function getDiscover(req, res) {
  const { slug } = req.params;
  const page = Number(req.query.page) || 1;

  const vibe = vibeDiscover[slug];

  if (!vibe) {
    return res.status(404).json({ error: `Unknown vibe "${slug}"` });
  }

  if (page < 1 || page > 500) {
    // TMDB caps discover pagination at 500
    return res.status(400).json({ error: 'page must be between 1 and 500' });
  }

  try {
    const [movies, shows] = await Promise.all([
      discoverFor('movie', vibe.movie, page),
      discoverFor('tv', vibe.tv, page),
    ]);

    const titles = filterTitles([...movies.results, ...shows.results]);
    const totalPages = Math.max(movies.totalPages || 0, shows.totalPages || 0);

    res.json({
      vibe: slug,
      page,
      total_pages: totalPages,
      titles,
    });
  } catch (err) {
    console.error(`Error running discover for "${slug}":`, err);
    res.status(500).json({ error: 'Failed to fetch discover results' });
  }
}
