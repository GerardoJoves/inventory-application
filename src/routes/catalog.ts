import { Router } from 'express';
import gameController from '../controllers/gameController.js';

const router = Router();

router.get('/', gameController.gamesListGet);
router.get('/developers', gameController.developersListGet);
router.get('/genres', gameController.genresListGet);
router.get('/genres/:genreId', gameController.gamesListByGenreGet);

export default router;
