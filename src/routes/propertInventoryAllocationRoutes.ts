import { Router } from 'express';
import AllocationController from '../controllers/PropertyInventoryAllocationController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

router.get('/', authorizePermissions('allocations:read'), AllocationController.getAllAllocations);
router.get('/:id', authorizePermissions('allocations:read'), AllocationController.getAllocationById);
router.post('/', authorizePermissions('allocations:write'), AllocationController.createAllocation);
router.put('/:id', authorizePermissions('allocations:write'), AllocationController.updateAllocation);
router.delete('/:id', authorizePermissions('allocations:write'), AllocationController.deleteAllocation);

export default router;