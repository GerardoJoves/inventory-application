import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import db, { NewGame } from '../db/queries.js';
import { matchedData, validationResult, body, query } from 'express-validator';

const gameValidation = [
  body('title', 'Title must not be empty').trim().isLength({ min: 1 }),
  body('description', 'Description must not be empty')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Description must be at least 10 characters long'),
  body('genres').isArray(),
  body('genres.*').isInt(),
  body('developers').isArray(),
  body('developers.*').isInt(),
  body('release_date').isDate(),
];

const gamesListGet = [
  query('search').optional().isString(),
  asyncHandler(async (req: Request, res: Response) => {
    const { search } = matchedData<{ search?: string }>(req);
    const games = search ? await db.getGames(search) : await db.getGames();
    res.render('catalog', { title: 'Games List', games: games.arr });
  }),
];

const gameDetailsGet = asyncHandler(async (req: Request, res: Response) => {
  const game = await db.getGameDetails(parseInt(req.params.gameId));
  res.render('gameDetails', { title: game.title, game });
});

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

const createGameGet = asyncHandler(async (_req, res: Response) => {
  const genres = await db.getGenres();
  const developers = await db.getDevelopers();
  res.render('gameForm', { title: 'Create Game', genres, developers });
});

const createGamePost = [
  ...gameValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).end();
      return;
    }
    const newGame = matchedData<NewGame>(req);
    const gameId = await db.insertGame(newGame);
    res.redirect('/catalog/' + gameId);
  }),
];

const createGenreGet = (_req: Request, res: Response) => {
  res.render('genreForm', { title: 'Create Genre' });
};

const createGenrePost = [
  body('name', 'Name must not be empty').trim().isLength({ min: 1 }),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).end();
      return;
    }
    const { name } = matchedData<{ name: string }>(req);
    await db.insertGenre(name);
    res.redirect('/catalog');
  }),
];

const createDeveloperGet = (_req: Request, res: Response) => {
  res.render('developerForm', { title: 'Create Developer' });
};

const createDeveloperPost = [
  body('name', 'Name must not be empty').trim().isLength({ min: 1 }),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).end();
      return;
    }
    const { name } = matchedData<{ name: string }>(req);
    await db.insertDeveloper(name);
    res.redirect('/catalog');
  }),
];

const updateGameGet = [
  asyncHandler(async (req: Request, res: Response) => {
    const gameId = parseInt(req.params.gameId);
    const game = await db.getGameDetails(gameId);
    const genres = await db.getGenres();
    const developers = await db.getDevelopers();
    res.render('gameForm', { title: 'Update Game', game, genres, developers });
  }),
];

const updateGamePost = [
  ...gameValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const gameId = parseInt(req.params.gameId);
    const game = matchedData<NewGame>(req);
    await db.updateGame(gameId, game);
    res.redirect(`/catalog/${gameId}`);
  }),
];

export default {
  gamesListGet,
  developersListGet,
  genresListGet,
  gamesListByGenreGet,
  gamesListByDeveloperGet,
  gameDetailsGet,
  createGameGet,
  createGamePost,
  createDeveloperGet,
  createDeveloperPost,
  createGenreGet,
  createGenrePost,
  updateGameGet,
  updateGamePost,
};
