// Scratch: compare result counts for different discover filter strategies.
import '../env.js';
import vibeDiscover from '../config/vibeDiscover.js';
import { tmdbFetch } from '../services/tmdb.js';


const tests = [
  {
    label: 'Animation + Comedy, exclude Kids(10762)',
    path: '/discover/tv',
    params: {
      with_genres: '16,35',
      without_genres: '10762',
      with_original_language: 'en',
      'vote_count.gte': 100,
      sort_by: 'popularity.desc',
    },
    show: 20,
  },
];

for (const test of tests) {
  const data = await tmdbFetch(test.path, test.params);
  console.log(`\n${test.label}`);
  console.log(`  total_results: ${data.total_results}`);
  console.log(`  top 5:`);
  data.results.slice(0, test.show || 5).forEach((r) => {
    console.log(`    ${r.title || r.name} (${(r.release_date || r.first_air_date || '').slice(0, 4)}) ${r.vote_average}`);
  });
}
