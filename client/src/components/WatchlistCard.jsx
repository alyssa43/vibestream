import Card from './Card.jsx';
import styles from './WatchlistCard.module.css';

export default function WatchlistCard({ title, onRemove, removing }) {
  return (
    <div className={styles.wrap}>
      <Card title={title} />
      <button
        type="button"
        className={styles.removeButton}
        aria-label={`Remove ${title.title} from My List`}
        onClick={onRemove}
        disabled={removing}
      >
        <XIcon />
      </button>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
