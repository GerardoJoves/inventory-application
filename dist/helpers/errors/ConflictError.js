import CustomError from './CustomError.js';
export default class BadRequestError extends CustomError {
    constructor() {
        super('Conflict');
        this.statusCode = 409;
    }
}
