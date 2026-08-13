import { Link } from 'react-router-dom';
import styles from './EmptyState.module.css';

export default function EmptyState({ heading, message, actionTo, actionLabel }) {
  return (
    <div className={styles.wrap}>
      {heading && <h2 className={styles.heading}>{heading}</h2>}
      {message && <p className={styles.message}>{message}</p>}
      {actionTo && actionLabel && (
        <Link to={actionTo} className={styles.action}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
