import VibeEntryCard from '../components/VibeEntryCard.jsx';
import { useVibes } from '../context/useVibes.js';
import styles from './Explore.module.css';

export default function Explore() {
  const { vibes, error } = useVibes();

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Explore</h1>
      <p className={styles.subheading}>Every vibe, browsable on its own.</p>

      {error && <p className={styles.error}>Couldn&rsquo;t load vibes. {error}</p>}
      {!error && vibes === null && <p className={styles.loading}>Loading&hellip;</p>}

      {!error && vibes && (
        <div className={styles.grid}>
          {vibes.map((vibe) => (
            <VibeEntryCard key={vibe.slug} vibe={vibe} />
          ))}
        </div>
      )}
    </div>
  );
}
