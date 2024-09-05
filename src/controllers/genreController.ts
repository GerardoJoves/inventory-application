import { body, param, matchedData, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import db from '../db/queries.js';
import BadRequestError from '../helpers/errors/BadRequestError.js';
import NotFoundError from '../helpers/errors/NotFoundError.js';
import ConflictError from '../helpers/errors/ConflictError.js';

const idValidationParam = [
  param('id').isInt({ min: 0, allow_leading_zeroes: false }).toInt(),
];

const idValidationBody = [
  body('id').isInt({ min: 0, allow_leading_zeroes: false }).toInt(),
];

const genreValidation = [
  body('name', 'Name must not be empty').trim().isLength({ min: 1 }),
];

const genreListGet = asyncHandler(async (_req, res: Response) => {
  const genres = await db.getGenres();
  res.render('genresList', { title: 'Genres List', genres });
});

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
    res.redirect('/genres');
  }),
];

const updateGenreGet = [
  ...idValidationParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const genre = await db.getGenreById(id);
    if (!genre) throw new NotFoundError();
    res.render('genreForm', { title: 'Update Genre', values: genre });
  }),
];

const updateGenrePost = [
  ...genreValidation,
  ...idValidationParam,
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
  ...idValidationParam,
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
  ...idValidationBody,
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
