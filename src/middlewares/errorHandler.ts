import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import CustomError from '../helpers/errors/CustomError.js';

const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof CustomError) {
    res.status(err.statusCode);
    res.render('error', { code: err.statusCode, message: err.message });
  } else {
    console.error(err);
    res.status(500);
    res.render('error', { code: 500, message: 'Something Went Wrong' });
  }
};

export default errorHandler;
