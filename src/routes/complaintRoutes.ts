import { Router } from 'express';
import ComplaintController from '../controllers/ComplaintController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Tenant complaint management
 */

router.post('/create-complaint', authorizePermissions('complaints:write'), ComplaintController.create);
router.get('/get-complaints', authorizePermissions('complaints:read'), ComplaintController.getAll);
router.get('/get-complaint', authorizePermissions('complaints:read'), ComplaintController.getById);
router.put('/update-complaint', authorizePermissions('complaints:write'), ComplaintController.update);
router.delete('/delete-complaint', authorizePermissions('complaints:delete'), ComplaintController.delete);

export default router;
