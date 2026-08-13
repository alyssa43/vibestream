// Display metadata for each vibe row. The vibe_titles table only stores slugs,
// so names, descriptions, accent colors, and row order live here.
// Order in this array is the order rows appear on the homepage.

const vibes = [
  {
    slug: 'edge-of-your-seat',
    name: 'Edge of Your Seat',
    description: 'High-tension thrillers, mysteries, crime, and true crime.',
    accent: '#ef4444',
  },
  {
    slug: 'guilty-pleasure',
    name: 'Guilty Pleasure',
    description: 'Nostalgic 90s/2000s comedies and reality TV.',
    accent: '#ec4899',
  },
  {
    slug: 'total-escapism',
    name: 'Total Escapism',
    description: 'Fantasy, sci-fi, epic adventures, and immersive worlds.',
    accent: '#8b5cf6',
  },
  {
    slug: 'warm-and-fuzzy',
    name: 'Warm & Fuzzy',
    description: 'Cozy romance and nostalgic, heartwarming family movies.',
    accent: '#f59e0b',
  },
  {
    slug: 'in-my-feels',
    name: 'In My Feels',
    description: 'Emotional, cathartic tearjerkers.',
    accent: '#3b82f6',
  },
  {
    slug: 'brain-off-comfort-on',
    name: 'Brain Off, Comfort On',
    description: 'Easy-laugh sitcoms and low-stakes comedy.',
    accent: '#14b8a6',
  },
  {
    slug: 'spooky-and-eerie',
    name: 'Spooky & Eerie',
    description: 'Horror classics, atmospheric scares, and true-crime adjacent.',
    accent: '#f97316',
  },
  {
    slug: 'mind-benders-and-twists',
    name: 'Mind-Benders & Twists',
    description: 'Psychological thrillers, unreliable narrators, and twist endings.',
    accent: '#a855f7',
  },
];

export default vibes;
