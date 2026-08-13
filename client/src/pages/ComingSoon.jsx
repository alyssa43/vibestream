import { Link, useParams } from 'react-router-dom';
import styles from './ComingSoon.module.css';

export default function ComingSoon({ label }) {
  const { slug } = useParams();

  return (
    <div className={styles.wrap}>
      <h1 className={styles.heading}>{label}</h1>
      <p className={styles.copy}>
        {slug
          ? `The "${slug.replace(/-/g, ' ')}" view is coming in a later phase.`
          : `${label} is coming in a later phase.`}
      </p>
      <Link to="/" className={styles.link}>
        Back to home
      </Link>
    </div>
  );
}
