import dotenv from 'dotenv';

dotenv.config();

const TMDB_BASE = 'https://api.themoviedb.org/3';

// Core primitive: any TMDB GET. Throws on non-2xx.
export async function tmdbFetch(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, value);
  });

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.TMDB_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Normalized card-shaped details. Returns null on failure instead of throwing,
// so one bad title can't collapse a whole row.
export async function fetchTmdbDetails(tmdbId, mediaType) {
  try {
    const data = await tmdbFetch(`/${mediaType}/${tmdbId}`);

    return {
      tmdb_id: data.id,
      media_type: mediaType,
      title: data.title || data.name,
      poster_path: data.poster_path,
      release_date: data.release_date || data.first_air_date,
      overview: data.overview,
    };
  } catch (err) {
    console.error(`TMDB fetch failed for ${mediaType}/${tmdbId}: ${err.message}`);
    return null;
  }
}

export async function fetchTmdbDetailsMany(rows) {
  const results = await Promise.all(
    rows.map((row) => fetchTmdbDetails(row.tmdb_id, row.media_type))
  );

  return results.filter((item) => item !== null);
}
