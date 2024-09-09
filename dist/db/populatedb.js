#! /usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import dotenv from 'dotenv';
const Client = pg.Client;
dotenv.config();
const client = new Client({
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
    database: process.env.PG_DATABASE,
});
const dataPath = path.join(import.meta.dirname, 'archive/games.json');
const data = fs.readFileSync(dataPath, 'utf8');
const games = JSON.parse(data);
const gamesByGenre = {};
const gamesByDeveloper = {};
function insertGame(game) {
    return __awaiter(this, void 0, void 0, function* () {
        const SQL = 'INSERT INTO games (title, description, release_date) VALUES ($1, $2, $3) RETURNING id;';
        const values = [game.title, game.description, game.release_date];
        const { rows } = yield client.query(SQL, values);
        const gameId = rows[0].id;
        game.genres.forEach((genre) => {
            if (gamesByGenre[genre]) {
                gamesByGenre[genre].push(gameId);
            }
            else {
                gamesByGenre[genre] = [gameId];
            }
        });
        game.developers.forEach((dev) => {
            if (gamesByDeveloper[dev]) {
                gamesByDeveloper[dev].push(gameId);
            }
            else {
                gamesByDeveloper[dev] = [gameId];
            }
        });
    });
}
function insertGenre(genre, gameIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const insertGenreSQL = 'INSERT INTO genres (name) VALUES ($1) RETURNING id;';
        const { rows } = yield client.query(insertGenreSQL, [genre]);
        const genreId = rows[0].id;
        for (const gameId of gameIds) {
            const junctionSQL = 'INSERT INTO game_genre (game_id, genre_id) VALUES ($1, $2);';
            yield client.query(junctionSQL, [gameId, genreId]);
        }
    });
}
function insertDeveloper(dev, gameIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const insertDevSQL = 'INSERT INTO developers (name) VALUES ($1) RETURNING id;';
        const { rows } = yield client.query(insertDevSQL, [dev]);
        const devId = rows[0].id;
        for (const gameId of gameIds) {
            const junctionSQL = 'INSERT INTO game_developer (game_id, developer_id) VALUES ($1, $2);';
            yield client.query(junctionSQL, [gameId, devId]);
        }
    });
}
const createTablesSQL = `
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(2000) NOT NULL CHECK (LENGTH(description) >= 10),
  release_date DATE
);

CREATE TABLE IF NOT EXISTS genres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS developers (
  id SERIAL PRIMARY KEY, 
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS game_genre (
  game_id INT, genre_id INT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE NO ACTION,
  PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE IF NOT EXISTS game_developer (
  game_id INT, developer_id INT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE NO ACTION,
  PRIMARY KEY (game_id, developer_id)
);
`;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('seeding...');
        yield client.connect();
        try {
            yield client.query(createTablesSQL);
            for (const game of games) {
                yield insertGame(game);
            }
            for (const [genre, gameIds] of Object.entries(gamesByGenre)) {
                yield insertGenre(genre, gameIds);
            }
            for (const [dev, gamesIds] of Object.entries(gamesByDeveloper)) {
                yield insertDeveloper(dev, gamesIds);
            }
        }
        finally {
            yield client.end();
        }
        console.log('done');
    });
}
main().catch((err) => {
    console.log(err);
    process.exit(1);
});
