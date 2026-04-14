import { Router } from 'express';
import TenantAllocationController from '../controllers/TenantAllocationController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TenantAllocations
 *   description: Tenant room/bed allocation management
 */

router.post('/create-allocation', authorizePermissions('allocations:write'), TenantAllocationController.create);
router.get('/get-allocations', authorizePermissions('allocations:read'), TenantAllocationController.getAll);
router.get('/get-allocation', authorizePermissions('allocations:read'), TenantAllocationController.getById);
router.put('/update-allocation', authorizePermissions('allocations:write'), TenantAllocationController.update);
router.delete('/delete-allocation', authorizePermissions('allocations:delete'), TenantAllocationController.delete);

export default router;
