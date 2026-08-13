import styles from './SkeletonCard.module.css';

export default function SkeletonCard() {
  return <div className={styles.skeletonCard} aria-hidden="true" />;
}
