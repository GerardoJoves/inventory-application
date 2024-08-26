import { Router } from 'express';
import gameController from '../controllers/gameController.js';

const router = Router();

router.get('/', gameController.gamesListGet);

export default router;
