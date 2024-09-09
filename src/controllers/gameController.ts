import { validationResult, matchedData } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import db, { NewGame } from '../db/queries.js';
import BadRequestError from '../helpers/errors/BadRequestError.js';
import NotFoundError from '../helpers/errors/NotFoundError.js';
import validation from '../helpers/validation.js';

type GamesQuery = {
  search?: string;
  page?: number;
};

const gameListGet = [
  validation.validateQuerySearch(),
  validation.validateQueryPage(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError();
    const limit = 10;
    const query = matchedData<GamesQuery>(req, { locations: ['query'] });
    const offset = query.page ? (query.page - 1) * limit : 0;
    const games = await db.getPaginated('games', query.search, limit, offset);
    const totalPages = games[0] ? Math.ceil(games[0].total / limit) : 1;
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
  validation.validateParamId(),
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
  validation.validateParamId(),
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
  validation.validateBodyId(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    await db.deleteGame(id);
    res.redirect('/games');
  }),
];

const gameListFilteredGet = (filterBy: 'developer' | 'genre') => [
  validation.validateParamId(),
  validation.validateQueryPage(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, page } = matchedData<{ id: number; page: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const limit = 10;
    const offset = page ? (page - 1) * limit : 0;
    const { filter, result: games } =
      filterBy === 'developer'
        ? await db.getPaginatedGamesByDeveloper(id, limit, offset)
        : await db.getPaginatedGamesByGenre(id, limit, offset);
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
  const genres = await db.getAllGenres();
  const developers = await db.getAllDevelopers();
  res.render('gameForm', { title: 'Create Game', genres, developers });
});

const createGamePost = [
  ...validation.validateGame(),
  asyncHandler(async (req: Request, res: Response) => {
    const values = matchedData<NewGame>(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const genres = await db.getAllGenres();
      const developers = await db.getAllDevelopers();
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
  validation.validateParamId(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const game = await db.getGame(id);
    if (!game) throw new NotFoundError();
    const [gameGenreIds, gameDeveloperIds, genres, developers] =
      await Promise.all([
        db.getGameGenreIds(id),
        db.getGameDeveloperIds(id),
        db.getAllGenres(),
        db.getAllDevelopers(),
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
  ...validation.validateGame(),
  validation.validateParamId(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, ...values } = matchedData<{ id: number } & NewGame>(req);
    if (isNaN(id)) throw new BadRequestError();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const genres = await db.getAllGenres();
      const developers = await db.getAllDevelopers();
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
