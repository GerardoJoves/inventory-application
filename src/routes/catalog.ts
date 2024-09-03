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
router
  .route('/developers/update/:developerId')
  .get(catalogController.updateDeveloperGet)
  .post(catalogController.updateDeveloperPost);
router.post('/developers/delete', catalogController.deleteDeveloperPost);
router.get('/developers/delete/:id', catalogController.deleteDeveloperGet);

router.get('/genres', catalogController.genresListGet);
router
  .route('/genres/create')
  .get(catalogController.createGenreGet)
  .post(catalogController.createGenrePost);
router
  .route('/genres/update/:genreId')
  .get(catalogController.updateGenreGet)
  .post(catalogController.updateGenrePost);
router.post('/genres/delete', catalogController.deleteGenrePost);
router.get('/genres/delete/:id', catalogController.deleteGenreGet);

router.get('/genres/:genreId', catalogController.gamesListByGenreGet);
router.get(
  '/developers/:developerId',
  catalogController.gamesListByDeveloperGet,
);
router
  .route('/update/:gameId')
  .get(catalogController.updateGameGet)
  .post(catalogController.updateGamePost);

router.get('/:gameId', catalogController.gameDetailsGet);

export default router;
