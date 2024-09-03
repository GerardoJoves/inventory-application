import CustomError from './CustomError.js';

export default class BadRequestError extends CustomError {
  constructor() {
    super('Conflict');
  }
  statusCode = 409;
}
