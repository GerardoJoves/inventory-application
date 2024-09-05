import { Router } from 'express';
import genreController from '../controllers/genreController.js';
import gameController from '../controllers/gameController.js';

const router = Router();

router.get('/', genreController.genreListGet);

router
  .route('/create')
  .get(genreController.createGenreGet)
  .post(genreController.createGenrePost);

router
  .route('/:id/update')
  .get(genreController.updateGenreGet)
  .post(genreController.updateGenrePost);

router.post('/delete', genreController.deleteGenrePost);
router.get('/:id/delete', genreController.deleteGenreGet);

router.get('/:id/games', gameController.gameListFilteredGet('genre'));

export default router;
