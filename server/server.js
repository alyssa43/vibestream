import './config.js'; // MUST be first -- loads .env before any other module
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import pgSession from 'connect-pg-simple';
import pool from './db/pool.js';
import authRouter from './routes/auth.js';
import tmdbRouter from './routes/tmdb.js';
import vibesRouter from './routes/vibes.js';
import watchlistRouter from './routes/watchlist.js';
import reviewsRouter from './routes/reviews.js';
import { connectMongo } from './db/mongo.js';

const app = express();
const PORT = process.env.PORT || 3001;
const PgSession = pgSession(session);

app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}));

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/tmdb', tmdbRouter);
app.use('/api/vibes', vibesRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/reviews', reviewsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`🎬🍿 VibeStream server running on http://localhost:${PORT}`);
  });
}) ;