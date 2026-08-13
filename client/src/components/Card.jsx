import { Link } from 'react-router-dom';
import { posterUrl } from '../lib/images.js';
import styles from './Card.module.css';

export default function Card({ title, accent }) {
  const { tmdb_id, media_type, title: name, poster_path } = title;
  const src = posterUrl(poster_path);

  return (
    <Link
      to={`/title/${media_type}/${tmdb_id}`}
      className={styles.card}
      style={{ '--card-accent': accent || 'var(--violet)' }}
      aria-label={name}
    >
      {src ? (
        <img className={styles.poster} src={src} alt={`${name} poster`} loading="lazy" />
      ) : (
        <div className={styles.placeholder}>
          <span>{name}</span>
        </div>
      )}
    </Link>
  );
}
