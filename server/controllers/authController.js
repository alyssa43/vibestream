import bcrypt from 'bcryptjs';
import pool from '../db/pool.js';

const BCRYPT_COST = 12;
const MIN_PASSWORD_LENGTH = 8;

// POST /api/auth/signup
export async function signup(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    const user = rows[0];

    // Log the user in immediately after signup
    req.session.userId = user.id;

    res.status(201).json({ user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    const user = rows[0];

    // Deliberately vague error message -- don't reveal whether the email exists
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;

    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
}

// POST /api/auth/logout
export function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
}

// GET /api/auth/me -- current user (route is wrapped in requireAuth)
export async function getCurrentUser(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );

    // Session points at a user that no longer exists (e.g. deleted account)
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}
