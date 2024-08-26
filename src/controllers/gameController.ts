import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import db from '../db/queries.js';

const gamesListGet = asyncHandler(async (_req, res: Response) => {
  const games = await db.getAllGames();
  res.render('catalog', { title: 'Games List', games });
});

export default { gamesListGet };
