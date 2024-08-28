import { QueryConfig } from 'pg';
import pool from './pool.js';

interface Game {
  id: number;
  title: string;
}

interface FullGame extends Game {
  price: number;
  description: string;
  release_date: Date;
}

interface Genre {
  id: number;
  name: string;
}

interface Developer {
  id: number;
  name: string;
}

const getGames = async (searchTerm?: string) => {
  let query: QueryConfig = {
    text: 'SELECT id, title FROM games',
  };
  if (searchTerm) {
    query = {
      text: 'SELECT id, title FROM games WHERE LOWER(title) LIKE $1',
      values: [`%${searchTerm.toLocaleLowerCase()}%`],
    };
  }
  const games = await pool.query<Game>(query);
  return { arr: games.rows };
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
    pool.query<Game>(gamesQuery),
  ]);
  return {
    genre: genre.rows[0],
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
    pool.query<Game>(gamesQuery),
  ]);
  return {
    developer: developer.rows[0],
    arr: games.rows,
  };
};

const getGameDetails = async (gameId: number) => {
  const gameSQL = 'SELECT * FROM games WHERE id = $1';
  const genresSQL =
    'SELECT id, name FROM genres JOIN game_genre ON genres.id = genre_id WHERE game_id = $1';
  const devSQL =
    'SELECT id, name FROM developers JOIN game_developer ON developers.id = developer_id WHERE game_id = $1';
  const [
    {
      rows: [game],
    },
    { rows: genres },
    { rows: developers },
  ] = await Promise.all([
    pool.query<FullGame>(gameSQL, [gameId]),
    pool.query<Genre>(genresSQL, [gameId]),
    pool.query<Developer>(devSQL, [gameId]),
  ]);
  return { ...game, genres, developers };
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

export default {
  getGames,
  getDevelopers,
  getGenres,
  getGamesByGenre,
  getGamesByDeveloper,
  getGameDetails,
};
