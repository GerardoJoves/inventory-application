import { body } from 'express-validator';

const rules = [
  body('name', 'Name must not be empty').trim().isLength({ min: 1 }),
];

export const developerRules = rules;
export const genreRules = rules;
