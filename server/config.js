// Loads .env into process.env. This file must be imported FIRST in server.js,
// before any module that reads process.env at load time -- ES module imports
// evaluate in order, so anything imported above this won't see the env vars.
// (This is what caused the TMDB 401: a module read process.env.TMDB_TOKEN
// before dotenv had run.)
import dotenv from 'dotenv';

dotenv.config();
