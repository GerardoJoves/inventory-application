import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import db from '../db/queries.js';

const gamesListGet = asyncHandler(async (_req, res: Response) => {
  const games = await db.getGames();
  res.render('catalog', { title: 'Games List', games });
});

const developersListGet = asyncHandler(async (_req, res: Response) => {
  const developers = await db.getDevelopers();
  res.render('developersList', { title: 'Developers List', developers });
});

const genresListGet = asyncHandler(async (_req, res: Response) => {
  const genres = await db.getGenres();
  res.render('genresList', { title: 'Genres List', genres });
});

export default {
  gamesListGet,
  developersListGet,
  genresListGet,
};
