import { Router } from 'express';
import gameController from '../controllers/gameController.js';
const router = Router();
router.get('/', gameController.gameListGet);
router
    .route('/create')
    .get(gameController.createGameGet)
    .post(gameController.createGamePost);
router
    .route('/:id/update')
    .get(gameController.updateGameGet)
    .post(gameController.updateGamePost);
router.post('/delete', gameController.deleteGamePost);
router.get('/:id/delete', gameController.deleteGameGet);
router.get('/:id', gameController.gameDetailsGet);
export default router;
