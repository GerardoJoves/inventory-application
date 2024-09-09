import { matchedData, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import db from '../db/queries.js';
import BadRequestError from '../helpers/errors/BadRequestError.js';
import NotFoundError from '../helpers/errors/NotFoundError.js';
import ConflictError from '../helpers/errors/ConflictError.js';
import validation from '../helpers/validation.js';

const developersListGet = [
  validation.validateQuerySearch(),
  validation.validateQueryPage(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new BadRequestError();
    const query = matchedData<{ search: string; page: number }>(req);
    const limit = 10;
    const offset = query.page ? (query.page - 1) * limit : 0;
    const developers = await db.getPaginated(
      'developers',
      query.search,
      limit,
      offset,
    );
    const totalPages = developers[0]
      ? Math.ceil(developers[0].total / limit)
      : 1;
    const locals = {
      title: 'Developer List',
      developers,
      query,
      curPage: query.page || 1,
      totalPages,
    };
    res.render('developersList', locals);
  }),
];

const createDeveloperGet = (_req: Request, res: Response) => {
  res.render('developerForm', { title: 'Create Developer' });
};

const createDeveloperPost = [
  validation.validateDeveloper(),
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
  validation.validateParamId(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = matchedData<{ id: number }>(req);
    if (isNaN(id)) throw new BadRequestError();
    const dev = await db.getDeveloperById(id);
    if (!dev) throw new NotFoundError();
    res.render('developerForm', { title: 'Update Developer', values: dev });
  }),
];

const updateDeveloperPost = [
  validation.validateDeveloper(),
  validation.validateParamId(),
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
  validation.validateParamId(),
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
  validation.validateBodyId(),
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
