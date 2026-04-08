import { Router } from 'express';
import UserController from '../controllers/UserController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, UserController.getProfile);
router.put('/roles', authenticate, authorize('admin'), UserController.updateRoles);

export default router;