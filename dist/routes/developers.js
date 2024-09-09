import { Router } from 'express';
import developerController from '../controllers/developerController.js';
import gameController from '../controllers/gameController.js';
const router = Router();
router.get('/', developerController.developersListGet);
router
    .route('/create')
    .get(developerController.createDeveloperGet)
    .post(developerController.createDeveloperPost);
router
    .route('/:id/update')
    .get(developerController.updateDeveloperGet)
    .post(developerController.updateDeveloperPost);
router.post('/delete', developerController.deleteDeveloperPost);
router.get('/:id/delete', developerController.deleteDeveloperGet);
router.get('/:id/games', gameController.gameListFilteredGet('developer'));
export default router;
