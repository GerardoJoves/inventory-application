import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import db, { NewGame } from '../db/queries.js';
import {
  matchedData,
  validationResult,
  body,
  query,
  param,
} from 'express-validator';
import NotFoundError from '../helpers/errors/NotFoundError.js';
import BadRquestError from '../helpers/errors/BadRequestError.js';
import ConflictError from '../helpers/errors/ConflictError.js';

const gameValidation = [
  body('title', 'Title must not be empty').trim().isLength({ min: 1 }),
  body('description', 'Description must not be empty')
    .trim()
    .isLength({ min: 1 }),
  body('genres', 'At least one genre must be selected').isArray(),
  body('genres.*').toInt().isInt(),
  body('developers', 'At least one developer must be selected').isArray(),
  body('developers.*').toInt().isInt(),
  body('release_date').isDate().optional({ values: 'falsy' }),
];

const genreValidation = [
  body('name', 'Name must not be empty').trim().isLength({ min: 1 }),
];

const developerValidation = [
  body('name', 'Name must not be empty').trim().isLength({ min: 1 }),
];

const gamesListGet = [
  query('search').optional().isString(),
  asyncHandler(async (req: Request, res: Response) => {
    const { search } = matchedData<{ search?: string }>(req);
    const games = search ? await db.getGames(search) : await db.getGames();
    res.render('catalog', { title: 'Games List', games: games.arr });
  }),
];

const gameDetailsGet = [
  param('gameId').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { gameId: id } = matchedData<{ gameId: number }>(req);
    if (isNaN(id)) throw new BadRquestError();
    const [game, genres, developers] = await Promise.all([
      db.getGame(id),
      db.getGameGenres(id),
      db.getGameDevelopers(id),
    ]);
    if (!game) throw new NotFoundError();
    res.render('gameDetails', { title: game.title, game, genres, developers });
  }),
];

const gamesListByGenreGet = [
  param('genreId').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { genreId: id } = matchedData<{ genreId: number }>(req);
    if (isNaN(id)) throw new BadRquestError();
    const games = await db.getGamesByGenre(id);
    if (!games.genre) throw new NotFoundError();
    const locals = {
      title: games.genre.name,
      games: games.arr,
      genre: games.genre,
    };
    res.render('catalog', locals);
  }),
];

const gamesListByDeveloperGet = [
  param('developerId').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { developerId: id } = matchedData<{ developerId: number }>(req);
    const games = await db.getGamesByDeveloper(id);
    res.render('catalog', {
      title: games.developer.name,
      games: games.arr,
      developer: games.developer,
    });
  }),
];

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
    res.redirect('/catalog/' + gameId);
  }),
];

const createGenreGet = (_req: Request, res: Response) => {
  res.render('genreForm', { title: 'Create Genre' });
};

const createGenrePost = [
  ...genreValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const values = matchedData<{ name: string }>(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const locals = {
        title: 'Create Genre',
        values,
        errors: errors.mapped(),
      };
      res.render('genreForm', locals);
      return;
    }
    await db.insertGenre(values);
    res.redirect('/catalog');
  }),
];

const createDeveloperGet = (_req: Request, res: Response) => {
  res.render('developerForm', { title: 'Create Developer' });
};

const createDeveloperPost = [
  ...developerValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const values = matchedData<{ name: string }>(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const locals = {
        title: 'Create Genre',
        values,
        errors: errors.mapped(),
      };
      res.render('genreForm', locals);
      return;
    }
    await db.insertDeveloper(values);
    res.redirect('/catalog');
  }),
];

const updateGameGet = [
  param('gameId').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { gameId: id } = matchedData<{ gameId: number }>(req);
    if (isNaN(id)) throw new BadRquestError();
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
  param('gameId').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    const mappedErrors = errors.mapped();
    if (mappedErrors.gameId) throw new BadRquestError();
    const { gameId: id, ...values } = matchedData<NewGame & { gameId: number }>(
      req,
    );
    if (!errors.isEmpty) {
      const genres = await db.getGenres();
      const developers = await db.getDevelopers();
      const locals = {
        title: 'Update Game',
        game: values,
        genres,
        developers,
        errors: errors.mapped(),
      };
      res.render('gameForm', locals);
      return;
    }
    await db.updateGame(id, values);
    res.redirect(`/catalog/${id}`);
  }),
];

const updateGenreGet = [
  param('genreId').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { genreId: id } = matchedData<{ genreId: number }>(req);
    if (isNaN(id)) throw new BadRquestError();
    const genre = await db.getGenreById(id);
    if (!genre) throw new NotFoundError();
    res.render('genreForm', { title: 'Update Genre', values: genre });
  }),
];

const updateGenrePost = [
  ...genreValidation,
  param('genreId').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { genreId: id } = matchedData<{ genreId: number }>(req, {
      locations: ['params'],
    });
    const values = matchedData<{ name: string }>(req, { locations: ['body'] });
    if (isNaN(id)) throw new BadRquestError();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const locals = {
        title: 'Update Genre',
        values,
        errros: errors.mapped(),
      };
      res.render('genreForm', locals);
      return;
    }
    await db.updateGenre(id, values);
    res.redirect('/catalog');
  }),
];

const updateDeveloperGet = [
  param('developerId').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { developerId: id } = matchedData<{ developerId: number }>(req);
    if (isNaN(id)) throw new BadRquestError();
    const dev = await db.getDeveloperById(id);
    if (!dev) throw new NotFoundError();
    res.render('developerForm', { title: 'Update Developer', values: dev });
  }),
];

const updateDeveloperPost = [
  ...developerValidation,
  param('developerId').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    const mappedErrors = errors.mapped();
    if (mappedErrors.developerId) throw new BadRquestError();
    const { developerId: id, ...values } = matchedData<{
      developerId: number;
      name: string;
    }>(req);
    if (!errors.isEmpty()) {
      const locals = {
        title: 'Update Developer',
        values,
        errros: mappedErrors,
      };
      res.render('developerForm', locals);
      return;
    }
    await db.updateDeveloper(id, values);
    res.redirect('/catalog');
  }),
];

const deleteGenreGet = [
  param('id').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (typeof id != 'number') throw new BadRquestError();
    const genre = await db.getGenre(id);
    if (!genre) throw new NotFoundError();
    const gamesCount = await db.countGamesByGenre(id);
    const locals = {
      title: 'Delete Genre',
      genre,
      gamesCount,
    };
    res.render('genreDelete', locals);
  }),
];

const deleteGenrePost = [
  body('id').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (!id) throw new NotFoundError();
    const gamesCount = await db.countGamesByGenre(id);
    if (gamesCount > 0) throw new ConflictError();
    await db.deleteGenre(id);
    res.redirect('/catalog');
  }),
];

const deleteDeveloperGet = [
  param('id').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (typeof id != 'number') throw new BadRquestError();
    const dev = await db.getDeveloper(id);
    if (!dev) throw new NotFoundError();
    const gamesCount = await db.countGamesByDeveloper(id);
    const locals = {
      title: 'Delete Genre',
      developer: dev,
      gamesCount,
    };
    res.render('developerDelete', locals);
  }),
];

const deleteDeveloperPost = [
  body('id').toInt().isInt(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (!id) throw new NotFoundError();
    const gamesCount = await db.countGamesByDeveloper(id);
    if (gamesCount > 0) throw new ConflictError();
    await db.deleteDeveloper(id);
    res.redirect('/catalog');
  }),
];

export default {
  deleteDeveloperGet,
  deleteDeveloperPost,
  deleteGenreGet,
  deleteGenrePost,
  updateDeveloperGet,
  updateDeveloperPost,
  updateGenreGet,
  updateGenrePost,
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
