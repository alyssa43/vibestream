import styles from './ToastList.module.css';

export default function ToastList({ toasts, onDismiss }) {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type] || ''}`}>
          <p className={styles.message}>{toast.message}</p>
          <button
            type="button"
            className={styles.dismiss}
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
