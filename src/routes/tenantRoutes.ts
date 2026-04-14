import { Router } from 'express';
import TenantController from '../controllers/TenantController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management
 */

router.post('/create-tenant', authorizePermissions('tenants:write'), TenantController.create);
router.get('/get-tenants', authorizePermissions('tenants:read'), TenantController.getAll);
router.get('/get-tenant', authorizePermissions('tenants:read'), TenantController.getById);
router.put('/update-tenant', authorizePermissions('tenants:write'), TenantController.update);
router.delete('/delete-tenant', authorizePermissions('tenants:delete'), TenantController.delete);

export default router;
