import CustomError from './CustomError.js';
export default class BadRequestError extends CustomError {
    constructor() {
        super('Bad Request');
        this.statusCode = 400;
    }
}
