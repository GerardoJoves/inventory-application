import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import db from '../db/queries.js';
import { matchedData } from 'express-validator';
import searchQueryRules from '../middleware/validation/searchQueryRules.js';

const gamesListGet = [
  searchQueryRules,
  asyncHandler(async (req: Request, res: Response) => {
    const { search } = matchedData<{ search?: string }>(req);
    let games;
    if (search) {
      games = await db.getGames(search);
    } else {
      games = await db.getGames();
    }
    res.render('catalog', { title: 'Games List', games: games.arr });
  }),
];

const gamesListByGenreGet = asyncHandler(
  async (req: Request, res: Response) => {
    const games = await db.getGamesByGenre(parseInt(req.params.genreId));
    res.render('catalog', { title: games.genre.name, games: games.arr });
  },
);

const gamesListByDeveloperGet = asyncHandler(
  async (req: Request, res: Response) => {
    const games = await db.getGamesByDeveloper(parseInt(req.params.devId));
    res.render('catalog', { title: games.developer.name, games: games.arr });
  },
);

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
  gamesListByGenreGet,
  gamesListByDeveloperGet,
};
