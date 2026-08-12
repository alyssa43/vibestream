import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TMDB_TOKEN;

const movies = [
  'Silence of the Lambs', 'The Usual Suspects', 'The Prestige', 'Shutter Island',
  'Fight Club', 'Memento', 'Black Swan', 'Oldboy', 'Inception', 'Donnie Darko',
  'The Machinist', 'A Beautiful Mind', 'Gone Girl', 'The Sixth Sense', 'Split', 'Vertigo'
];

const tvShows = [
  'Mr. Robot', 'Severance', 'Westworld', 'Dark', 'Behind Her Eyes'
];

async function searchTitle(query, mediaType) {
  const url = `https://api.themoviedb.org/3/search/${mediaType}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  const top = data.results?.[0];
  return top
    ? { query, tmdb_id: top.id, media_type: mediaType, matched_title: top.title || top.name, year: (top.release_date || top.first_air_date || '').slice(0, 4) }
    : { query, tmdb_id: null, media_type: mediaType, matched_title: 'NOT FOUND' };
}

async function run() {
  const results = [];

  for (const title of movies) {
    results.push(await searchTitle(title, 'movie'));
  }
  for (const title of tvShows) {
    results.push(await searchTitle(title, 'tv'));
  }

  console.log(JSON.stringify(results, null, 2));
}

run();