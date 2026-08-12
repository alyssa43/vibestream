// Scratch utility: look up TMDB keyword IDs by name.
// Like lookup-titles.js, this is meant to be edited and re-run, not preserved.
import '../config.js';
import { tmdbFetch } from '../services/tmdb.js';

const keywords = [
  'time loop',
  'twist ending',
  'unreliable narrator',
  'psychological thriller',
  'nostalgia',
  'haunted house',
  'serial killer',
];

for (const keyword of keywords) {
  const data = await tmdbFetch('/search/keyword', { query: keyword });
  const top = data.results.slice(0, 3);

  console.log(`\n"${keyword}"`);
  if (top.length === 0) {
    console.log('  (no matches)');
  } else {
    top.forEach((k) => console.log(`  ${k.id}  ${k.name}`));
  }
}
