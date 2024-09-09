import CustomError from '../helpers/errors/CustomError.js';
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof CustomError) {
        res.status(err.statusCode);
        res.render('error', { code: err.statusCode, message: err.message });
    }
    else {
        console.error(err);
        res.status(500);
        res.render('error', { code: 500, message: 'Something Went Wrong' });
    }
};
export default errorHandler;
