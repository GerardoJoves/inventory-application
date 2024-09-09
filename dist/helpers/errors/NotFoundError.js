import CustomError from './CustomError.js';
export default class NotFoundError extends CustomError {
    constructor() {
        super('Not Found.');
        this.statusCode = 404;
    }
}
