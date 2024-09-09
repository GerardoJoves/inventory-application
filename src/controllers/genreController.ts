import { matchedData, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import db from '../db/queries.js';
import BadRequestError from '../helpers/errors/BadRequestError.js';
import NotFoundError from '../helpers/errors/NotFoundError.js';
import ConflictError from '../helpers/errors/ConflictError.js';
import validation from '../helpers/validation.js';

const genreListGet = [
  validation.validateQuerySearch(),
  validation.validateQueryPage(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError();
    const query = matchedData<{ search: string; page: number }>(req);
    const limit = 10;
    const offset = query.page ? (query.page - 1) * limit : 0;
    const genres = await db.getPaginated('genres', query.search, limit, offset);
    const totalPages = genres[0] ? Math.ceil(genres[0].total / limit) : 1;
    const locals = {
      title: 'Genre List',
      genres,
      query,
      curPage: query.page || 1,
      totalPages,
    };
    res.render('genresList', locals);
  }),
];

const createGenreGet = (_req: Request, res: Response) => {
  res.render('genreForm', { title: 'Create Genre' });
};

const createGenrePost = [
  validation.validateGenre(),
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
    res.redirect('/genres');
  }),
];

const updateGenreGet = [
  validation.validateParamId(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const genre = await db.getGenreById(id);
    if (!genre) throw new NotFoundError();
    res.render('genreForm', { title: 'Update Genre', values: genre });
  }),
];

const updateGenrePost = [
  validation.validateGenre(),
  validation.validateParamId(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id, ...values } = matchedData<{ id: number; name: string }>(req);
    if (isNaN(id)) throw new BadRequestError();
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
    res.redirect(`/genres/${id}/games`);
  }),
];

const deleteGenreGet = [
  validation.validateParamId(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
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
  validation.validateBodyId(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new NotFoundError();
    const gamesCount = await db.countGamesByGenre(id);
    if (gamesCount > 0) throw new ConflictError();
    await db.deleteGenre(id);
    res.redirect(`/genres`);
  }),
];

export default {
  genreListGet,
  createGenreGet,
  createGenrePost,
  updateGenreGet,
  updateGenrePost,
  deleteGenreGet,
  deleteGenrePost,
};
