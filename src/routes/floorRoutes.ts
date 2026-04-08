import { Router } from 'express';
import FloorController from '../controllers/FloorController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, FloorController.getAllFloors);
router.get('/:id', authenticate, FloorController.getFloorById);
router.post('/', authenticate, authorize('manager', 'admin'), FloorController.createFloor);
router.put('/:id', authenticate, authorize('manager', 'admin'), FloorController.updateFloor);
router.delete('/:id', authenticate, authorize('admin'), FloorController.deleteFloor);

export default router;