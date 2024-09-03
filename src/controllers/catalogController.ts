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

const gameDetailsGet = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.gameId);
  const [game, genres, developers] = await Promise.all([
    db.getGame(id),
    db.getGameGenres(id),
    db.getGameDevelopers(id),
  ]);
  res.render('gameDetails', { title: game.title, game, genres, developers });
});

const gamesListByGenreGet = asyncHandler(
  async (req: Request, res: Response) => {
    const games = await db.getGamesByGenre(parseInt(req.params.genreId));
    res.render('catalog', {
      title: games.genre.name,
      games: games.arr,
      genre: games.genre,
    });
  },
);

const gamesListByDeveloperGet = asyncHandler(
  async (req: Request, res: Response) => {
    const games = await db.getGamesByDeveloper(parseInt(req.params.devId));
    res.render('catalog', {
      title: games.developer.name,
      games: games.arr,
      developer: games.developer,
    });
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

const updateGameGet = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.gameId);
  const [game, gameGenreIds, gameDeveloperIds, genres, developers] =
    await Promise.all([
      db.getGame(id),
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
});

const updateGamePost = [
  ...gameValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const gameId = parseInt(req.params.gameId);
    const values = matchedData<NewGame>(req);
    const errors = validationResult(req);
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
    await db.updateGame(gameId, values);
    res.redirect(`/catalog/${gameId}`);
  }),
];

const updateGenreGet = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.genreId);
  const genre = await db.getGenreById(id);
  res.render('genreForm', { title: 'Update Genre', values: genre });
});

const updateGenrePost = [
  ...genreValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.genreId);
    const values = matchedData<{ name: string }>(req);
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

const updateDeveloperGet = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.developerId);
  const genre = await db.getDeveloperById(id);
  res.render('genreForm', { title: 'Update Developer', values: genre });
});

const updateDeveloperPost = [
  ...developerValidation,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.genreId);
    const values = matchedData<{ name: string }>(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const locals = {
        title: 'Update Developer',
        values,
        errros: errors.mapped(),
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
