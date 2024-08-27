import pool from './pool.js';

const getGames = async () => {
  const SQL = 'SELECT id, title FROM games';
  const { rows } = await pool.query<{ id: number; title: string }>(SQL);
  return rows;
};

const getDevelopers = async () => {
  const SQL = 'SELECT * FROM developers';
  const { rows } = await pool.query<{ id: number; name: string }>(SQL);
  return rows;
};

const getGenres = async () => {
  const SQL = 'SELECT * FROM genres';
  const { rows } = await pool.query<{ id: number; name: string }>(SQL);
  return rows;
};

export default {
  getGames,
  getDevelopers,
  getGenres,
};
