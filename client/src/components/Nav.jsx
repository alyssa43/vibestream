import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore' },
  { to: '/search', label: 'Search' },
  { to: '/watchlist', label: 'My List' },
];

export default function Nav() {
  const { user, logout, deleteAccount } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  function closeMenu() {
    setMenuOpen(false);
    setConfirmingDelete(false);
    setPassword('');
    setDeleteError('');
  }

  function backToMenu() {
    setConfirmingDelete(false);
    setPassword('');
    setDeleteError('');
  }

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointer(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        if (confirmingDelete) {
          backToMenu();
        } else {
          closeMenu();
        }
      }
    }

    function handleKey(e) {
      if (e.key !== 'Escape') return;
      if (confirmingDelete) {
        backToMenu();
      } else {
        closeMenu();
      }
    }

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen, confirmingDelete]);

  async function handleLogout() {
    closeMenu();
    await logout();
    navigate('/');
  }

  async function handleDeleteAccount() {
    if (!password) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(password);
      closeMenu();
      navigate('/');
    } catch (err) {
      setPassword('');
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <header className={styles.nav}>
      <Link to="/" className={styles.wordmark} aria-label="VibeStream home">
        VIBE<span className={styles.wordmarkAccent}>STREAM</span>
      </Link>

      <ul className={styles.links}>
        {NAV_LINKS.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? `${styles.link} ${styles.linkActive}` : styles.link)}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className={styles.account} ref={menuRef}>
        {user ? (
          <>
            <button
              type="button"
              className={styles.accountButton}
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <AccountIcon />
            </button>
            {menuOpen && (
              <div className={styles.menu} role="menu">
                <p className={styles.menuEmail}>{user.email}</p>
                {confirmingDelete ? (
                  <div className={styles.deleteConfirm}>
                    <p className={styles.deleteWarning}>
                      This permanently deletes your account, watchlist, and reviews. This
                      can&apos;t be undone.
                    </p>
                    {deleteError && <p className={styles.deleteError}>{deleteError}</p>}
                    <input
                      type="password"
                      className={styles.deleteInput}
                      placeholder="Confirm your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={deleting}
                    />
                    <div className={styles.deleteActions}>
                      <button
                        type="button"
                        className={styles.menuItem}
                        onClick={backToMenu}
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.deleteConfirmButton}
                        onClick={handleDeleteAccount}
                        disabled={deleting || !password}
                      >
                        Delete my account
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button type="button" className={styles.menuItem} onClick={handleLogout} role="menuitem">
                      Log out
                    </button>
                    <button
                      type="button"
                      className={styles.menuItemDanger}
                      onClick={() => setConfirmingDelete(true)}
                      role="menuitem"
                    >
                      Delete account
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <Link to="/login" className={styles.accountButton} aria-label="Log in">
            <AccountIcon />
          </Link>
        )}
      </div>
    </header>
  );
}

function AccountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
