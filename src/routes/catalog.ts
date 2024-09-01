import { Router } from 'express';
import catalogController from '../controllers/catalogController.js';

const router = Router();

router.get('/', catalogController.gamesListGet);
router
  .route('/create')
  .get(catalogController.createGameGet)
  .post(catalogController.createGamePost);

router.get('/developers', catalogController.developersListGet);
router
  .route('/developers/create')
  .get(catalogController.createDeveloperGet)
  .post(catalogController.createDeveloperPost);

router.get('/genres', catalogController.genresListGet);
router
  .route('/genres/create')
  .get(catalogController.createGenreGet)
  .post(catalogController.createGenrePost);

router.get('/genres/:genreId', catalogController.gamesListByGenreGet);
router.get('/developers/:devId', catalogController.gamesListByDeveloperGet);
router
  .route('/update/:gameId')
  .get(catalogController.updateGameGet)
  .post(catalogController.updateGamePost);

router.get('/:gameId', catalogController.gameDetailsGet);

export default router;
