import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import db from '../db/queries.js';

const gamesListGet = asyncHandler(async (req: Request, res: Response) => {
  let games;
  if (req.params.genreId) {
    games = await db.getGamesByGenre(parseInt(req.params.genreId));
    res.render('catalog', { title: games.genre.name, games: games.arr });
  } else {
    games = await db.getGames();
    res.render('catalog', { title: 'Games List', games: games.arr });
  }
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
