import { body, query, param } from 'express-validator';
const validateGame = () => [
    body('title', 'Title must not be empty').trim().isLength({ min: 1 }),
    body('description', 'Description must not be empty')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    body('genres', 'At least one genre must be selected').isArray({ min: 1 }),
    body('genres.*').isInt({ min: 0, allow_leading_zeroes: false }).toInt(),
    body('developers', 'At least one developer must be selected').isArray({
        min: 1,
    }),
    body('developers.*').isInt({ min: 0, allow_leading_zeroes: false }).toInt(),
    body('release_date')
        .trim()
        .isDate()
        .customSanitizer((v) => new Date(v))
        .optional({ values: 'falsy' }),
];
const validateParamId = () => param('id').isInt({ min: 0, allow_leading_zeroes: false }).toInt();
const validateBodyId = () => body('id').isInt({ min: 0, allow_leading_zeroes: false }).toInt();
const validateQuerySearch = () => query('search').optional().isString();
const validateQueryPage = () => query('page')
    .optional()
    .isInt({ min: 1, allow_leading_zeroes: false })
    .toInt();
const validateGenre = () => body('name', 'Name must not be empty')
    .trim()
    .notEmpty()
    .isLength({ max: 50 })
    .withMessage('Genre name must be less than 50 characters long');
const validateDeveloper = () => body('name', 'Name must not be empty')
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Developer name must be less than 100 characters long');
export default {
    validateGame,
    validateParamId,
    validateBodyId,
    validateQuerySearch,
    validateQueryPage,
    validateGenre,
    validateDeveloper,
};
