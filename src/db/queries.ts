import { PoolClient, QueryConfig } from 'pg';
import pool from './pool.js';

interface GamePreview {
  id: number;
  title: string;
}

interface FullGame {
  id: number;
  title: string;
  description: string;
  release_date?: Date;
}

export interface NewGame extends Omit<FullGame, 'id'> {
  genres: number[];
  developers: number[];
}

interface Genre {
  id: number;
  name: string;
}

interface Developer {
  id: number;
  name: string;
}

const getGames = async (searchTerm = '', limit = 10, offset = 0) => {
  let query: QueryConfig = {
    text: 'SELECT id, title, COUNT(*) OVER() AS games_total FROM games LIMIT $1 OFFSET $2',
    values: [limit, offset],
  };
  if (searchTerm) {
    query = {
      text: 'SELECT id, title, COUNT(*) OVER() AS games_total FROM games WHERE LOWER(title) LIKE $1 LIMIT $2 OFFSET $3',
      values: [`%${searchTerm.toLocaleLowerCase()}%`, limit, offset],
    };
  }
  const res = await pool.query<GamePreview & { games_total: number }>(query);
  return res.rows;
};

const getGamesByGenre = async (genreId: number) => {
  const genreQuery = {
    text: 'SELECT * FROM genres WHERE id = $1',
    values: [genreId],
  };
  const gamesQuery = {
    text: 'SELECT games.id, games.title FROM games JOIN game_genre ON games.id = game_id WHERE genre_id = $1',
    values: [genreId],
  };
  const [genre, games] = await Promise.all([
    pool.query<Genre>(genreQuery),
    pool.query<GamePreview>(gamesQuery),
  ]);
  return {
    filter: genre.rows[0],
    arr: games.rows,
  };
};

const getGamesByDeveloper = async (devId: number) => {
  const genreQuery = {
    text: 'SELECT * FROM developers WHERE id = $1',
    values: [devId],
  };
  const gamesQuery = {
    text: 'SELECT games.id, games.title FROM games JOIN game_developer ON games.id = game_id WHERE developer_id = $1',
    values: [devId],
  };
  const [developer, games] = await Promise.all([
    pool.query<Developer>(genreQuery),
    pool.query<GamePreview>(gamesQuery),
  ]);
  return {
    filter: developer.rows[0],
    arr: games.rows,
  };
};

const getGame = async (gameId: number) => {
  const query = {
    text: 'SELECT * FROM games WHERE id = $1',
    values: [gameId],
  };
  const {
    rows: [game],
  } = await pool.query<FullGame>(query);
  return game;
};

const getGameGenres = async (gameId: number) => {
  const query = {
    text: 'SELECT id, name FROM genres JOIN game_genre ON genres.id = genre_id WHERE game_id = $1',
    values: [gameId],
  };
  const { rows: genres } = await pool.query<Genre>(query);
  return genres;
};

const getGameDevelopers = async (gameId: number) => {
  const query = {
    text: 'SELECT id, name FROM developers JOIN game_developer ON developers.id = developer_id WHERE game_id = $1',
    values: [gameId],
  };
  const { rows: developers } = await pool.query<Developer>(query);
  return developers;
};

const getGameGenreIds = async (gameId: number) => {
  const query = {
    text: 'SELECT genre_id FROM game_genre WHERE game_id = $1',
    values: [gameId],
    rowMode: 'array',
  };
  const { rows } = await pool.query<[number]>(query);
  return rows.flat();
};

const getGameDeveloperIds = async (gameId: number) => {
  const query = {
    text: 'SELECT developer_id FROM game_developer WHERE game_id = $1',
    values: [gameId],
    rowMode: 'array',
  };
  const { rows } = await pool.query<[number]>(query);
  return rows.flat();
};

const getDevelopers = async () => {
  const SQL = 'SELECT * FROM developers';
  const { rows } = await pool.query<Developer>(SQL);
  return rows;
};

const getGenres = async () => {
  const SQL = 'SELECT * FROM genres';
  const { rows } = await pool.query<Genre>(SQL);
  return rows;
};

async function insertGameGenreAssociations(
  client: PoolClient,
  gameId: number,
  genreIds: number[],
) {
  const query = {
    text: `INSERT INTO game_genre (game_id, genre_id)
    VALUES ${genreIds.map((_, i) => `($1, $${i + 2})`).join(',')}`,
    values: [gameId, ...genreIds],
  };
  await client.query(query);
}

async function insertGameDeveloperAssociations(
  client: PoolClient,
  gameId: number,
  developerIds: number[],
) {
  const query = {
    text: `INSERT INTO game_developer (game_id, developer_id)
    VALUES ${developerIds.map((_, i) => `($1, $${i + 2})`).join(',')}`,
    values: [gameId, ...developerIds],
  };
  await client.query(query);
}

const insertGame = async (game: NewGame) => {
  let gameId: number;
  const insertGameQuery = {
    text: 'INSERT INTO games (title, description, release_date) VALUES ($1, $2, $3) RETURNING id',
    values: [game.title, game.description, game.release_date || null],
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query<{ id: number }>(insertGameQuery);
    gameId = res.rows[0].id;
    await insertGameGenreAssociations(client, gameId, game.genres);
    await insertGameDeveloperAssociations(client, gameId, game.developers);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  return gameId;
};

const updateGame = async (gameId: number, game: NewGame) => {
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(updateGameRecord);
    await client.query(removeGameGenreStaleAssociations);
    await client.query(removeGameDevStaleAssociations);
    await client.query(addGameGenreAssociations);
    await client.query(addGameDevAssociations);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const insertGenre = async ({ name }: { name: string }) => {
  const query = {
    text: 'INSERT INTO genres (name) VALUES ($1) RETURNING id',
    values: [name],
  };
  const { rows } = await pool.query<{ id: number }>(query);
  return rows[0].id;
};

const insertDeveloper = async ({ name }: { name: string }) => {
  const query = {
    text: 'INSERT INTO developers (name) VALUES ($1) RETURNING id',
    values: [name],
  };
  const { rows } = await pool.query<{ id: number }>(query);
  return rows[0].id;
};

const updateGenre = async (id: number, { name }: { name: string }) => {
  const query = {
    text: 'UPDATE genres SET name = $2 WHERE id = $1 RETURNING id',
    values: [id, name],
  };
  const { rows } = await pool.query<{ id: number }>(query);
  if (!rows[0]) return;
  return rows[0].id;
};

const deleteGenre = async (id: number) => {
  const query = {
    text: 'DELETE FROM genres WHERE id = $1',
    values: [id],
  };
  await pool.query(query);
};

const deleteDeveloper = async (id: number) => {
  const query = {
    text: 'DELETE FROM developers WHERE id = $1',
    values: [id],
  };
  await pool.query(query);
};

const countGamesByGenre = async (id: number) => {
  const query = {
    text: 'SELECT COUNT(*) AS count FROM game_genre WHERE genre_id = $1',
    values: [id],
  };
  const { rows } = await pool.query<{ count: number }>(query);
  return rows[0].count;
};

const countGamesByDeveloper = async (id: number) => {
  const query = {
    text: 'SELECT COUNT(*) AS count FROM game_developer WHERE developer_id = $1',
    values: [id],
  };
  const { rows } = await pool.query<{ count: number }>(query);
  return rows[0].count;
};

const updateDeveloper = async (id: number, { name }: { name: string }) => {
  const query = {
    text: 'UPDATE developers SET name = $2 WHERE id = $1 RETURNING id',
    values: [id, name],
  };
  const { rows } = await pool.query<{ id: number }>(query);
  if (!rows[0]) return;
  return rows[0].id;
};

const getGenreById = async (id: number) => {
  const query = {
    text: 'SELECT * FROM genres WHERE id = $1',
    values: [id],
  };
  const { rows } = await pool.query<Genre>(query);
  return rows[0];
};

const getDeveloperById = async (id: number) => {
  const query = {
    text: 'SELECT * FROM developers WHERE id = $1',
    values: [id],
  };
  const { rows } = await pool.query<Genre>(query);
  return rows[0];
};

const getGenre = async (id: number) => {
  const query = {
    text: 'SELECT * FROM genres WHERE id = $1',
    values: [id],
  };
  const { rows } = await pool.query<Genre>(query);
  return rows[0];
};

const getDeveloper = async (id: number) => {
  const query = {
    text: 'SELECT * FROM developers WHERE id = $1',
    values: [id],
  };
  const { rows } = await pool.query<Developer>(query);
  return rows[0];
};

const deleteGame = async (id: number) => {
  const query = {
    text: 'DELETE FROM games WHERE id = $1',
    values: [id],
  };
  await pool.query(query);
};

export default {
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
  getGames,
  getGameDeveloperIds,
  getGameGenreIds,
  getDevelopers,
  getGenres,
  getGamesByGenre,
  getGamesByDeveloper,
  getGame,
  getGameGenres,
  getGameDevelopers,
  insertGame,
  insertDeveloper,
  insertGenre,
  updateGame,
};
