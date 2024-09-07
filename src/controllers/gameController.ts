import {
  body,
  query,
  param,
  matchedData,
  validationResult,
} from 'express-validator';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import db, { NewGame } from '../db/queries.js';
import BadRequestError from '../helpers/errors/BadRequestError.js';
import NotFoundError from '../helpers/errors/NotFoundError.js';

type GamesQuery = {
  search?: string;
  page?: number;
};

const gameValidation = [
  body('title', 'Title must not be empty').trim().isLength({ min: 1 }),
  body('description', 'Description must not be empty')
    .trim()
    .isLength({ min: 1 }),
  body('genres', 'At least one genre must be selected').isArray({ min: 1 }),
  body('genres.*').isInt({ min: 0, allow_leading_zeroes: false }).toInt(),
  body('developers', 'At least one developer must be selected').isArray({
    min: 1,
  }),
  body('developers.*').isInt({ min: 0, allow_leading_zeroes: false }).toInt(),
  body('release_date')
    .trim()
    .isDate()
    .customSanitizer((v: string) => new Date(v))
    .optional({ values: 'falsy' }),
];

const idValidationParam = [
  param('id').isInt({ min: 0, allow_leading_zeroes: false }).toInt(),
];

const idValidationBody = [
  body('id').isInt({ min: 0, allow_leading_zeroes: false }),
];

const gameListGet = [
  query('search').optional().isString(),
  query('page')
    .optional()
    .isInt({ min: 1, allow_leading_zeroes: false })
    .toInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError();
    const limit = 10;
    const query = matchedData<GamesQuery>(req, { locations: ['query'] });
    const offset = query.page ? (query.page - 1) * limit : 0;
    const games = await db.getGames(query.search, limit, offset);
    const totalPages = games[0] ? Math.ceil(games[0].total_games / limit) : 1;
    const locals = {
      title: 'Game List',
      games,
      query,
      curPage: query.page || 1,
      totalPages,
    };
    res.render('catalog', locals);
  }),
];

const gameDetailsGet = [
  ...idValidationParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const [game, genres, developers] = await Promise.all([
      db.getGame(id),
      db.getGameGenres(id),
      db.getGameDevelopers(id),
    ]);
    if (!game) throw new NotFoundError();
    res.render('gameDetails', { title: game.title, game, genres, developers });
  }),
];

const deleteGameGet = [
  ...idValidationParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const game = await db.getGame(id);
    if (!game) throw new NotFoundError();
    const locals = {
      title: 'Delete Game',
      game,
    };
    res.render('gameDelete', locals);
  }),
];

const deleteGamePost = [
  ...idValidationBody,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    await db.deleteGame(id);
    res.redirect('/games');
  }),
];

const gameListFilteredGet = (filterBy: 'developer' | 'genre') => [
  ...idValidationParam,
  query('page')
    .optional()
    .isInt({ min: 1, allow_leading_zeroes: false })
    .toInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, page } = matchedData<{ id: number; page: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const limit = 10;
    const offset = page ? (page - 1) * limit : 0;
    const { filter, result: games } =
      filterBy === 'developer'
        ? await db.getGamesByDeveloper(id, limit, offset)
        : await db.getGamesByGenre(id, limit, offset);
    if (!filter) throw new NotFoundError();
    const totalPages = games[0] ? Math.ceil(games[0].total_games / limit) : 1;
    const locals = {
      title: filter.name,
      filter: { type: filterBy, ...filter },
      games,
      curPage: page || 1,
      totalPages,
    };
    res.render('catalog', locals);
  }),
];

const createGameGet = asyncHandler(async (_req, res: Response) => {
  const genres = await db.getGenres();
  const developers = await db.getDevelopers();
  res.render('gameForm', { title: 'Create Game', genres, developers });
});

const createGamePost = [
  ...gameValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const values = matchedData<NewGame>(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const genres = await db.getGenres();
      const developers = await db.getDevelopers();
      const locals = {
        title: 'Create Game',
        values,
        genres,
        developers,
        errors: errors.mapped(),
      };
      res.render('gameForm', locals);
      return;
    }
    const gameId = await db.insertGame(values);
    res.redirect('/games/' + gameId);
  }),
];

const updateGameGet = [
  ...idValidationParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const game = await db.getGame(id);
    if (!game) throw new NotFoundError();
    const [gameGenreIds, gameDeveloperIds, genres, developers] =
      await Promise.all([
        db.getGameGenreIds(id),
        db.getGameDeveloperIds(id),
        db.getGenres(),
        db.getDevelopers(),
      ]);
    const values = {
      ...game,
      genres: gameGenreIds,
      developers: gameDeveloperIds,
    };
    res.render('gameForm', {
      title: 'Update Game',
      values,
      genres,
      developers,
    });
  }),
];

const updateGamePost = [
  ...gameValidation,
  ...idValidationParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, ...values } = matchedData<{ id: number } & NewGame>(req);
    if (isNaN(id)) throw new BadRequestError();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const genres = await db.getGenres();
      const developers = await db.getDevelopers();
      const locals = {
        title: 'Update Game',
        values,
        genres,
        developers,
        errors: errors.mapped(),
      };
      res.render('gameForm', locals);
      return;
    }
    await db.updateGame(id, values);
    res.redirect(`/games/${id}`);
  }),
];

export default {
  gameListGet,
  gameListFilteredGet,
  gameDetailsGet,
  createGameGet,
  createGamePost,
  updateGameGet,
  updateGamePost,
  deleteGameGet,
  deleteGamePost,
};
