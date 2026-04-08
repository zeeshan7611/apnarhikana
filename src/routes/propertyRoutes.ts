import { Router } from 'express';
import PropertyController from '../controllers/PropertyController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, PropertyController.getAllProperties);
router.get('/:id', authenticate, PropertyController.getPropertyById);
router.post('/', authenticate, authorize('manager', 'admin'), PropertyController.createProperty);
router.put('/:id', authenticate, authorize('manager', 'admin'), PropertyController.updateProperty);
router.delete('/:id', authenticate, authorize('admin'), PropertyController.deleteProperty);

export default router;