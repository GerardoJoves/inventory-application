import { body } from 'express-validator';

const rules = [
  body('title', 'Title must not be empty').trim().isLength({ min: 1 }),
  body('description', 'Description must not be empty')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('genres').isArray(),
  body('genres.*').isInt(),
  body('developers').isArray(),
  body('developers.*').isInt(),
  body('release_date').isDate(),
];

export default rules;
