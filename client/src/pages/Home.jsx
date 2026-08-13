import { useEffect, useState } from 'react';
import { getVibes } from '../api/client.js';
import VibeRow from '../components/VibeRow.jsx';
import styles from './Home.module.css';

export default function Home() {
  const [vibes, setVibes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getVibes()
      .then(({ vibes: list }) => setVibes(list))
      .catch((err) => setError(err.message || 'Something went wrong.'));
  }, []);

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <h1 className={styles.headline}>
          what are you
          <br />
          in the <span className={styles.gradientText}>mood for?</span>
        </h1>
        <p className={styles.subheadline}>Skip the genres. Find something that fits the vibe.</p>
      </section>

      <div className={styles.rows}>
        {error && <p className={styles.error}>Couldn&rsquo;t load vibes. {error}</p>}
        {!error && vibes === null && <p className={styles.loading}>Loading vibes&hellip;</p>}
        {!error && vibes && vibes.map((vibe) => <VibeRow key={vibe.slug} vibe={vibe} />)}
      </div>
    </>
  );
}
