import { body, param, matchedData, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import db from '../db/queries.js';
import BadRequestError from '../helpers/errors/BadRequestError.js';
import NotFoundError from '../helpers/errors/NotFoundError.js';
import ConflictError from '../helpers/errors/ConflictError.js';

const developerValidation = [
  body('name', 'Name must not be empty').trim().isLength({ min: 1 }),
];

const idValidationParam = [
  param('id').isInt({ min: 0, allow_leading_zeroes: false }).toInt(),
];

const idValidationBody = [
  body('id').isInt({ min: 0, allow_leading_zeroes: false }).toInt(),
];

const developersListGet = asyncHandler(async (_req, res: Response) => {
  const developers = await db.getDevelopers();
  res.render('developersList', { title: 'Developers List', developers });
});

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
    res.redirect('/developers');
  }),
];

const updateDeveloperGet = [
  ...idValidationParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const dev = await db.getDeveloperById(id);
    if (!dev) throw new NotFoundError();
    res.render('developerForm', { title: 'Update Developer', values: dev });
  }),
];

const updateDeveloperPost = [
  ...developerValidation,
  ...idValidationParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id, ...values } = matchedData<{ id: number; name: string }>(req);
    const errors = validationResult(req);
    if (isNaN(id)) throw new BadRequestError();
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
    res.redirect(`/developers/${id}/games`);
  }),
];

const deleteDeveloperGet = [
  ...idValidationParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (typeof id != 'number') throw new BadRequestError();
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
  ...idValidationBody,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (!id) throw new NotFoundError();
    const gamesCount = await db.countGamesByDeveloper(id);
    if (gamesCount > 0) throw new ConflictError();
    await db.deleteDeveloper(id);
    res.redirect(`/developers`);
  }),
];

export default {
  developersListGet,
  createDeveloperGet,
  createDeveloperPost,
  updateDeveloperGet,
  updateDeveloperPost,
  deleteDeveloperGet,
  deleteDeveloperPost,
};
