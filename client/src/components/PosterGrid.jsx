import styles from './PosterGrid.module.css';

export default function PosterGrid({ children }) {
  return <div className={styles.grid}>{children}</div>;
}
