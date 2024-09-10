import pg from 'pg';
import dotenv from 'dotenv';
const Pool = pg.Pool;
dotenv.config();

const connection = {
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT) : 5432,
  database: process.env.PG_DATABASE,
  ssl: true,
};

export default new Pool(connection);
