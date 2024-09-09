import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => {
    res.redirect('/games');
});
export default router;
