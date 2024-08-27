import pool from './pool.js';

interface Game {
  id: number;
  title: string;
}

interface Genre {
  id: number;
  name: string;
}

interface Developer {
  id: number;
  name: string;
}

const getGames = async () => {
  const SQL = 'SELECT id, title FROM games';
  const games = await pool.query<Game>(SQL);
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
};
