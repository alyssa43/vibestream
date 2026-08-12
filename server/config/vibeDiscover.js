// Discover-query recipes for each vibe's "View All" page.
//
// These are hand-tuned per vibe because TMDB genres are categories and our
// vibes are moods -- the mapping is lossy. Notes on the levers:
//   - comma in with_genres = AND (must have all), pipe = OR (any)
//   - vote_count.gte keeps out brand-new releases with provisional ratings
//   - a date ceiling is also needed when sorting by popularity, since TMDB
//     popularity is recency-weighted and floods lists with unreleased titles
//   - vote_average.lte (a rating CEILING) is what makes "comfort" vibes work:
//     a guilty pleasure is by definition not critically acclaimed
//   - TV needs different genre IDs (TMDB collapses several movie genres),
//     first_air_date instead of primary_release_date, and lower vote floors
//   - with_original_language: 'en' on TV -- without it, TMDB's ratings skew
//     so heavily toward anime that every list becomes an anime leaderboard
//   - a `tv` value may be an ARRAY of param sets when one query can't capture
//     the vibe (see guilty-pleasure); the controller merges the results
//   - a vibe with no `tv` block is movies-only by design

const vibeDiscover = {
  'edge-of-your-seat': {
    movie: {
      with_genres: '53,80',
      'vote_average.gte': 6.5,
      'vote_count.gte': 800,
      sort_by: 'vote_average.desc',
    },
    tv: {
      with_genres: '80,18',
      with_original_language: 'en',
      'vote_average.gte': 7.5,
      'vote_count.gte': 300,
      sort_by: 'vote_average.desc',
    },
  },

  'guilty-pleasure': {
    movie: {
      with_genres: '35,10749',
      'primary_release_date.gte': '1990-01-01',
      'primary_release_date.lte': '2009-12-31',
      'vote_average.gte': 5.5,
      'vote_average.lte': 7.0,
      'vote_count.gte': 500,
      sort_by: 'popularity.desc',
    },
    // Two queries: TMDB has no single genre that captures this vibe. Adult
    // animation and reality TV are both guilty pleasures but share no genre.
    tv: [
      {
        // Adult animation. Excluding Kids(10762) is what keeps this from
        // turning into a children's programming block after ~10 results.
        with_genres: '16,35',
        without_genres: '10762',
        with_original_language: 'en',
        'vote_count.gte': 100,
        sort_by: 'popularity.desc',
      },
      {
        // Reality. Excluding Talk(10767) drops late-night shows.
        with_genres: '10764',
        without_genres: '10767',
        with_original_language: 'en',
        include_adult: false,
        'vote_count.gte': 20,
        sort_by: 'popularity.desc',
      },
    ],
  },

  'total-escapism': {
    movie: {
      with_genres: '878|14',
      'vote_average.gte': 7.0,
      'vote_count.gte': 1000,
      sort_by: 'vote_average.desc',
    },
    tv: {
      with_genres: '10765',
      with_original_language: 'en',
      'vote_average.gte': 7.5,
      'vote_count.gte': 300,
      sort_by: 'vote_average.desc',
    },
  },

  'warm-and-fuzzy': {
    movie: {
      with_genres: '10751|10749',
      'primary_release_date.lte': '2024-12-31',
      'vote_average.gte': 6.0,
      'vote_average.lte': 7.8,
      'vote_count.gte': 1000,
      sort_by: 'popularity.desc',
    },
    tv: {
      with_genres: '35,18',
      with_original_language: 'en',
      'vote_average.gte': 6.5,
      'vote_count.gte': 150,
      sort_by: 'popularity.desc',
    },
  },

  'in-my-feels': {
    // Drama alone returns the canonical greatest-films list (Godfather,
    // Schindler's List). Adding Romance and capping the rating steers toward
    // emotional tearjerkers instead of prestige epics.
    movie: {
      with_genres: '18,10749',
      'vote_average.gte': 7.0,
      'vote_average.lte': 8.3,
      'vote_count.gte': 800,
      sort_by: 'vote_average.desc',
    },
    tv: {
      with_genres: '18',
      with_original_language: 'en',
      'vote_average.gte': 7.5,
      'vote_count.gte': 200,
      sort_by: 'vote_average.desc',
    },
  },

  'brain-off-comfort-on': {
    movie: {
      with_genres: '35',
      without_genres: '16',
      'primary_release_date.gte': '2000-01-01',
      'primary_release_date.lte': '2024-12-31',
      'vote_average.gte': 6.0,
      'vote_average.lte': 7.5,
      'vote_count.gte': 800,
      sort_by: 'popularity.desc',
    },
    tv: {
      with_genres: '35',
      without_genres: '10767',
      with_original_language: 'en',
      'vote_average.gte': 6.5,
      'vote_average.lte': 8.2,
      'vote_count.gte': 150,
      sort_by: 'popularity.desc',
    },
  },

  // Movies only: TMDB has no Horror genre for TV, and every substitute we
  // tested (Mystery, Mystery+Drama, Crime+Mystery, Crime+Sci-Fi) returned
  // detective procedurals and teen supernatural drama rather than horror.
  'spooky-and-eerie': {
    movie: {
      with_genres: '27',
      'vote_average.gte': 6.5,
      'vote_count.gte': 1000,
      sort_by: 'vote_average.desc',
    },
  },

  'mind-benders-and-twists': {
    movie: {
      with_genres: '53,9648',
      'vote_average.gte': 7.0,
      'vote_count.gte': 500,
      sort_by: 'vote_average.desc',
    },
    tv: {
      with_genres: '9648,18',
      with_original_language: 'en',
      'vote_average.gte': 7.5,
      'vote_count.gte': 200,
      sort_by: 'vote_average.desc',
    },
  },
};

export default vibeDiscover;
