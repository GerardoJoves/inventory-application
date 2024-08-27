import { Router } from 'express';
import gameController from '../controllers/gameController.js';

const router = Router();

router.get('/', gameController.gamesListGet);
router.get('/developers', gameController.developersListGet);
router.get('/genres', gameController.genresListGet);
export default router;
