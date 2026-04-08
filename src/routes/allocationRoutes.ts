import { Router } from 'express';
import AllocationController from '../controllers/AllocationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, AllocationController.getAllAllocations);
router.get('/:id', authenticate, AllocationController.getAllocationById);
router.post('/', authenticate, authorize('manager', 'admin'), AllocationController.createAllocation);
router.put('/:id', authenticate, authorize('manager', 'admin'), AllocationController.updateAllocation);
router.delete('/:id', authenticate, authorize('admin'), AllocationController.deleteAllocation);

export default router;