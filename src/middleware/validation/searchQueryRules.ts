import { query } from 'express-validator';

export default query('search').optional().isString();
