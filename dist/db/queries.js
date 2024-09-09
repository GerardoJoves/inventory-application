var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import pool from './pool.js';
const getPaginated = (entity_1, ...args_1) => __awaiter(void 0, [entity_1, ...args_1], void 0, function* (entity, keyword = '', limit = 10, offset = 0) {
    let text;
    const values = [limit, offset];
    if (keyword)
        values.push(`%${keyword}%`);
    switch (entity) {
        case 'games':
            text = `SELECT id, title, COUNT(*) OVER() AS total FROM games ${keyword ? 'WHERE LOWER(title) LIKE LOWER($3)' : ''} LIMIT $1 OFFSET $2`;
            break;
        case 'developers':
            text = `SELECT id, name, COUNT(*) OVER() AS total FROM developers ${keyword ? 'WHERE LOWER(name) LIKE LOWER($3)' : ''} LIMIT $1 OFFSET $2`;
            break;
        case 'genres':
            text = `SELECT id, name, COUNT(*) OVER() AS total FROM genres ${keyword ? 'WHERE LOWER(name) LIKE LOWER($3)' : ''} LIMIT $1 OFFSET $2`;
            break;
    }
    const res = yield pool.query({ text, values });
    return res.rows;
});
const getPaginatedGamesByGenre = (genreId_1, ...args_1) => __awaiter(void 0, [genreId_1, ...args_1], void 0, function* (genreId, limit = 10, offset = 0) {
    const genreQuery = {
        text: 'SELECT * FROM genres WHERE id = $1',
        values: [genreId],
    };
    const gamesQuery = {
        text: 'SELECT games.id, games.title, COUNT(*) OVER() AS total_games FROM games JOIN game_genre ON games.id = game_id WHERE genre_id = $1 LIMIT $2 OFFSET $3',
        values: [genreId, limit, offset],
    };
    const [genre, games] = yield Promise.all([
        pool.query(genreQuery),
        pool.query(gamesQuery),
    ]);
    return {
        filter: genre.rows[0],
        result: games.rows,
    };
});
const getPaginatedGamesByDeveloper = (devId_1, ...args_1) => __awaiter(void 0, [devId_1, ...args_1], void 0, function* (devId, limit = 10, offset = 0) {
    const genreQuery = {
        text: 'SELECT * FROM developers WHERE id = $1',
        values: [devId],
    };
    const gamesQuery = {
        text: 'SELECT games.id, games.title, COUNT(*) OVER() AS total_games FROM games JOIN game_developer ON games.id = game_id WHERE developer_id = $1 LIMIT $2 OFFSET $3',
        values: [devId, limit, offset],
    };
    const [developer, games] = yield Promise.all([
        pool.query(genreQuery),
        pool.query(gamesQuery),
    ]);
    return {
        filter: developer.rows[0],
        result: games.rows,
    };
});
const getGame = (gameId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT * FROM games WHERE id = $1',
        values: [gameId],
    };
    const { rows: [game], } = yield pool.query(query);
    return game;
});
const getGameGenres = (gameId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT id, name FROM genres JOIN game_genre ON genres.id = genre_id WHERE game_id = $1',
        values: [gameId],
    };
    const { rows: genres } = yield pool.query(query);
    return genres;
});
const getGameDevelopers = (gameId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT id, name FROM developers JOIN game_developer ON developers.id = developer_id WHERE game_id = $1',
        values: [gameId],
    };
    const { rows: developers } = yield pool.query(query);
    return developers;
});
const getGameGenreIds = (gameId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT genre_id FROM game_genre WHERE game_id = $1',
        values: [gameId],
        rowMode: 'array',
    };
    const { rows } = yield pool.query(query);
    return rows.flat();
});
const getGameDeveloperIds = (gameId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT developer_id FROM game_developer WHERE game_id = $1',
        values: [gameId],
        rowMode: 'array',
    };
    const { rows } = yield pool.query(query);
    return rows.flat();
});
const getAllDevelopers = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT id, name FROM developers';
    const { rows } = yield pool.query(query);
    return rows;
});
const getAllGenres = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = 'SELECT id, name FROM genres';
    const { rows } = yield pool.query(query);
    return rows;
});
function insertGameGenreAssociations(client, gameId, genreIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = {
            text: `INSERT INTO game_genre (game_id, genre_id)
    VALUES ${genreIds.map((_, i) => `($1, $${i + 2})`).join(',')}`,
            values: [gameId, ...genreIds],
        };
        yield client.query(query);
    });
}
function insertGameDeveloperAssociations(client, gameId, developerIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = {
            text: `INSERT INTO game_developer (game_id, developer_id)
    VALUES ${developerIds.map((_, i) => `($1, $${i + 2})`).join(',')}`,
            values: [gameId, ...developerIds],
        };
        yield client.query(query);
    });
}
const insertGame = (game) => __awaiter(void 0, void 0, void 0, function* () {
    let gameId;
    const insertGameQuery = {
        text: 'INSERT INTO games (title, description, release_date) VALUES ($1, $2, $3) RETURNING id',
        values: [game.title, game.description, game.release_date || null],
    };
    const client = yield pool.connect();
    try {
        yield client.query('BEGIN');
        const res = yield client.query(insertGameQuery);
        gameId = res.rows[0].id;
        yield insertGameGenreAssociations(client, gameId, game.genres);
        yield insertGameDeveloperAssociations(client, gameId, game.developers);
        yield client.query('COMMIT');
    }
    catch (e) {
        yield client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
    return gameId;
});
const updateGame = (gameId, game) => __awaiter(void 0, void 0, void 0, function* () {
    const updateGameRecord = {
        text: 'UPDATE games SET title = $2, description = $3, release_date = $4 WHERE id = $1',
        values: [gameId, game.title, game.description, game.release_date || null],
    };
    const removeGameGenreStaleAssociations = {
        text: `DELETE FROM game_genre 
      WHERE game_id = $1 AND genre_id NOT IN (${game.genres.map((_, i) => `$${i + 2}`).join(',')})`,
        values: [gameId, ...game.genres],
    };
    const removeGameDevStaleAssociations = {
        text: `DELETE FROM game_developer 
      WHERE game_id = $1 AND developer_id NOT IN (${game.developers.map((_, i) => `$${i + 2}`).join(',')})`,
        values: [gameId, ...game.developers],
    };
    const addGameGenreAssociations = {
        text: `INSERT INTO game_genre (game_id, genre_id)
      VALUES ${game.genres.map((_, i) => `($1, $${i + 2})`).join(',')} ON CONFLICT DO NOTHING`,
        values: [gameId, ...game.genres],
    };
    const addGameDevAssociations = {
        text: `INSERT INTO game_developer (game_id, developer_id)
      VALUES ${game.developers.map((_, i) => `($1, $${i + 2})`).join(',')} ON CONFLICT DO NOTHING`,
        values: [gameId, ...game.developers],
    };
    const client = yield pool.connect();
    try {
        yield client.query('BEGIN');
        yield client.query(updateGameRecord);
        yield client.query(removeGameGenreStaleAssociations);
        yield client.query(removeGameDevStaleAssociations);
        yield client.query(addGameGenreAssociations);
        yield client.query(addGameDevAssociations);
        yield client.query('COMMIT');
    }
    catch (e) {
        yield client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
});
const insertGenre = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name }) {
    const query = {
        text: 'INSERT INTO genres (name) VALUES ($1) RETURNING id',
        values: [name],
    };
    const { rows } = yield pool.query(query);
    return rows[0].id;
});
const insertDeveloper = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name }) {
    const query = {
        text: 'INSERT INTO developers (name) VALUES ($1) RETURNING id',
        values: [name],
    };
    const { rows } = yield pool.query(query);
    return rows[0].id;
});
const updateGenre = (id_1, _a) => __awaiter(void 0, [id_1, _a], void 0, function* (id, { name }) {
    const query = {
        text: 'UPDATE genres SET name = $2 WHERE id = $1 RETURNING id',
        values: [id, name],
    };
    const { rows } = yield pool.query(query);
    if (!rows[0])
        return;
    return rows[0].id;
});
const deleteGenre = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'DELETE FROM genres WHERE id = $1',
        values: [id],
    };
    yield pool.query(query);
});
const deleteDeveloper = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'DELETE FROM developers WHERE id = $1',
        values: [id],
    };
    yield pool.query(query);
});
const countGamesByGenre = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT COUNT(*) AS count FROM game_genre WHERE genre_id = $1',
        values: [id],
    };
    const { rows } = yield pool.query(query);
    return rows[0].count;
});
const countGamesByDeveloper = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT COUNT(*) AS count FROM game_developer WHERE developer_id = $1',
        values: [id],
    };
    const { rows } = yield pool.query(query);
    return rows[0].count;
});
const updateDeveloper = (id_1, _a) => __awaiter(void 0, [id_1, _a], void 0, function* (id, { name }) {
    const query = {
        text: 'UPDATE developers SET name = $2 WHERE id = $1 RETURNING id',
        values: [id, name],
    };
    const { rows } = yield pool.query(query);
    if (!rows[0])
        return;
    return rows[0].id;
});
const getGenreById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT * FROM genres WHERE id = $1',
        values: [id],
    };
    const { rows } = yield pool.query(query);
    return rows[0];
});
const getDeveloperById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT * FROM developers WHERE id = $1',
        values: [id],
    };
    const { rows } = yield pool.query(query);
    return rows[0];
});
const getGenre = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT * FROM genres WHERE id = $1',
        values: [id],
    };
    const { rows } = yield pool.query(query);
    return rows[0];
});
const getDeveloper = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'SELECT * FROM developers WHERE id = $1',
        values: [id],
    };
    const { rows } = yield pool.query(query);
    return rows[0];
});
const deleteGame = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {
        text: 'DELETE FROM games WHERE id = $1',
        values: [id],
    };
    yield pool.query(query);
});
export default {
    getPaginated,
    getAllDevelopers,
    getAllGenres,
    deleteGame,
    getGenre,
    getDeveloper,
    countGamesByDeveloper,
    countGamesByGenre,
    deleteDeveloper,
    deleteGenre,
    getGenreById,
    getDeveloperById,
    updateDeveloper,
    updateGenre,
    getGameDeveloperIds,
    getGameGenreIds,
    getPaginatedGamesByGenre,
    getPaginatedGamesByDeveloper,
    getGame,
    getGameGenres,
    getGameDevelopers,
    insertGame,
    insertDeveloper,
    insertGenre,
    updateGame,
};
