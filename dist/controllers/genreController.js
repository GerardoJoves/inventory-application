var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { matchedData, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import db from '../db/queries.js';
import BadRequestError from '../helpers/errors/BadRequestError.js';
import NotFoundError from '../helpers/errors/NotFoundError.js';
import ConflictError from '../helpers/errors/ConflictError.js';
import validation from '../helpers/validation.js';
const genreListGet = [
    validation.validateQuerySearch(),
    validation.validateQueryPage(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            throw new BadRequestError();
        const query = matchedData(req);
        const limit = 10;
        const offset = query.page ? (query.page - 1) * limit : 0;
        const genres = yield db.getPaginated('genres', query.search, limit, offset);
        const totalPages = genres[0] ? Math.ceil(genres[0].total / limit) : 1;
        const locals = {
            title: 'Genre List',
            genres,
            query,
            curPage: query.page || 1,
            totalPages,
        };
        res.render('genresList', locals);
    })),
];
const createGenreGet = (_req, res) => {
    res.render('genreForm', { title: 'Create Genre' });
};
const createGenrePost = [
    validation.validateGenre(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const values = matchedData(req);
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
        yield db.insertGenre(values);
        res.redirect('/genres');
    })),
];
const updateGenreGet = [
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (isNaN(id))
            throw new BadRequestError();
        const genre = yield db.getGenreById(id);
        if (!genre)
            throw new NotFoundError();
        res.render('genreForm', { title: 'Update Genre', values: genre });
    })),
];
const updateGenrePost = [
    validation.validateGenre(),
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const _a = matchedData(req), { id } = _a, values = __rest(_a, ["id"]);
        if (isNaN(id))
            throw new BadRequestError();
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
        yield db.updateGenre(id, values);
        res.redirect(`/genres/${id}/games`);
    })),
];
const deleteGenreGet = [
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (isNaN(id))
            throw new BadRequestError();
        const genre = yield db.getGenre(id);
        if (!genre)
            throw new NotFoundError();
        const gamesCount = yield db.countGamesByGenre(id);
        const locals = {
            title: 'Delete Genre',
            genre,
            gamesCount,
        };
        res.render('genreDelete', locals);
    })),
];
const deleteGenrePost = [
    validation.validateBodyId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (isNaN(id))
            throw new NotFoundError();
        const gamesCount = yield db.countGamesByGenre(id);
        if (gamesCount > 0)
            throw new ConflictError();
        yield db.deleteGenre(id);
        res.redirect(`/genres`);
    })),
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
