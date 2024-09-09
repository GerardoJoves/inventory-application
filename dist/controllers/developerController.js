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
const developersListGet = [
    validation.validateQuerySearch(),
    validation.validateQueryPage(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            throw new BadRequestError();
        const query = matchedData(req);
        const limit = 10;
        const offset = query.page ? (query.page - 1) * limit : 0;
        const developers = yield db.getPaginated('developers', query.search, limit, offset);
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
    })),
];
const createDeveloperGet = (_req, res) => {
    res.render('developerForm', { title: 'Create Developer' });
};
const createDeveloperPost = [
    validation.validateDeveloper(),
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
        yield db.insertDeveloper(values);
        res.redirect('/developers');
    })),
];
const updateDeveloperGet = [
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (isNaN(id))
            throw new BadRequestError();
        const dev = yield db.getDeveloperById(id);
        if (!dev)
            throw new NotFoundError();
        res.render('developerForm', { title: 'Update Developer', values: dev });
    })),
];
const updateDeveloperPost = [
    validation.validateDeveloper(),
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const _a = matchedData(req), { id } = _a, values = __rest(_a, ["id"]);
        const errors = validationResult(req);
        if (isNaN(id))
            throw new BadRequestError();
        if (!errors.isEmpty()) {
            const locals = {
                title: 'Update Developer',
                values,
                errros: errors.mapped(),
            };
            res.render('developerForm', locals);
            return;
        }
        yield db.updateDeveloper(id, values);
        res.redirect(`/developers/${id}/games`);
    })),
];
const deleteDeveloperGet = [
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (typeof id != 'number')
            throw new BadRequestError();
        const dev = yield db.getDeveloper(id);
        if (!dev)
            throw new NotFoundError();
        const gamesCount = yield db.countGamesByDeveloper(id);
        const locals = {
            title: 'Delete Genre',
            developer: dev,
            gamesCount,
        };
        res.render('developerDelete', locals);
    })),
];
const deleteDeveloperPost = [
    validation.validateBodyId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (!id)
            throw new NotFoundError();
        const gamesCount = yield db.countGamesByDeveloper(id);
        if (gamesCount > 0)
            throw new ConflictError();
        yield db.deleteDeveloper(id);
        res.redirect(`/developers`);
    })),
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
