import { Link } from 'react-router-dom';
import styles from './VibeEntryCard.module.css';

export default function VibeEntryCard({ vibe }) {
  const { slug, name, description, accent } = vibe;

  return (
    <Link to={`/vibe/${slug}`} className={styles.card} style={{ '--card-accent': accent }}>
      <span className={styles.accentBar} />
      <h2 className={styles.name}>{name}</h2>
      <p className={styles.description}>{description}</p>
    </Link>
  );
}
