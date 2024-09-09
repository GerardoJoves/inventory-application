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
import { validationResult, matchedData } from 'express-validator';
import asyncHandler from 'express-async-handler';
import db from '../db/queries.js';
import BadRequestError from '../helpers/errors/BadRequestError.js';
import NotFoundError from '../helpers/errors/NotFoundError.js';
import validation from '../helpers/validation.js';
const gameListGet = [
    validation.validateQuerySearch(),
    validation.validateQueryPage(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            throw new BadRequestError();
        const limit = 10;
        const query = matchedData(req, { locations: ['query'] });
        const offset = query.page ? (query.page - 1) * limit : 0;
        const games = yield db.getPaginated('games', query.search, limit, offset);
        const totalPages = games[0] ? Math.ceil(games[0].total / limit) : 1;
        const locals = {
            title: 'Game List',
            games,
            query,
            curPage: query.page || 1,
            totalPages,
        };
        res.render('catalog', locals);
    })),
];
const gameDetailsGet = [
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (isNaN(id))
            throw new BadRequestError();
        const [game, genres, developers] = yield Promise.all([
            db.getGame(id),
            db.getGameGenres(id),
            db.getGameDevelopers(id),
        ]);
        if (!game)
            throw new NotFoundError();
        res.render('gameDetails', { title: game.title, game, genres, developers });
    })),
];
const deleteGameGet = [
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (isNaN(id))
            throw new BadRequestError();
        const game = yield db.getGame(id);
        if (!game)
            throw new NotFoundError();
        const locals = {
            title: 'Delete Game',
            game,
        };
        res.render('gameDelete', locals);
    })),
];
const deleteGamePost = [
    validation.validateBodyId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (isNaN(id))
            throw new BadRequestError();
        yield db.deleteGame(id);
        res.redirect('/games');
    })),
];
const gameListFilteredGet = (filterBy) => [
    validation.validateParamId(),
    validation.validateQueryPage(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id, page } = matchedData(req);
        if (isNaN(id))
            throw new BadRequestError();
        const limit = 10;
        const offset = page ? (page - 1) * limit : 0;
        const { filter, result: games } = filterBy === 'developer'
            ? yield db.getPaginatedGamesByDeveloper(id, limit, offset)
            : yield db.getPaginatedGamesByGenre(id, limit, offset);
        if (!filter)
            throw new NotFoundError();
        const totalPages = games[0] ? Math.ceil(games[0].total_games / limit) : 1;
        const locals = {
            title: filter.name,
            filter: Object.assign({ type: filterBy }, filter),
            games,
            curPage: page || 1,
            totalPages,
        };
        res.render('catalog', locals);
    })),
];
const createGameGet = asyncHandler((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const genres = yield db.getAllGenres();
    const developers = yield db.getAllDevelopers();
    res.render('gameForm', { title: 'Create Game', genres, developers });
}));
const createGamePost = [
    ...validation.validateGame(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const values = matchedData(req);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const genres = yield db.getAllGenres();
            const developers = yield db.getAllDevelopers();
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
        const gameId = yield db.insertGame(values);
        res.redirect('/games/' + gameId);
    })),
];
const updateGameGet = [
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = matchedData(req);
        if (isNaN(id))
            throw new BadRequestError();
        const game = yield db.getGame(id);
        if (!game)
            throw new NotFoundError();
        const [gameGenreIds, gameDeveloperIds, genres, developers] = yield Promise.all([
            db.getGameGenreIds(id),
            db.getGameDeveloperIds(id),
            db.getAllGenres(),
            db.getAllDevelopers(),
        ]);
        const values = Object.assign(Object.assign({}, game), { genres: gameGenreIds, developers: gameDeveloperIds });
        res.render('gameForm', {
            title: 'Update Game',
            values,
            genres,
            developers,
        });
    })),
];
const updateGamePost = [
    ...validation.validateGame(),
    validation.validateParamId(),
    asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const _a = matchedData(req), { id } = _a, values = __rest(_a, ["id"]);
        if (isNaN(id))
            throw new BadRequestError();
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const genres = yield db.getAllGenres();
            const developers = yield db.getAllDevelopers();
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
        yield db.updateGame(id, values);
        res.redirect(`/games/${id}`);
    })),
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
