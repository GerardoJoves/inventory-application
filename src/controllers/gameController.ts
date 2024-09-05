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
  asyncHandler(async (req: Request, res: Response) => {
    const { search } = matchedData<{ search?: string }>(req);
    const games = search ? await db.getGames(search) : await db.getGames();
    res.render('catalog', { title: 'Games List', games: games.arr });
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
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const gameList =
      filterBy === 'developer'
        ? await db.getGamesByDeveloper(id)
        : await db.getGamesByGenre(id);
    if (!gameList.filter) throw new NotFoundError();
    const locals = {
      title: gameList.filter.name,
      filter: { type: filterBy, ...gameList.filter },
      games: gameList.arr,
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
