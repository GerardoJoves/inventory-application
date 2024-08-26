import pool from './pool.js';

const getAllGames = async () => {
  const SQL = 'SELECT id, title FROM games';
  const { rows } = await pool.query<{ id: number; title: string }>(SQL);
  return rows;
};

export default { getAllGames };
