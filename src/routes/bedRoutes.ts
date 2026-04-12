import { Router } from 'express';
import BedController from '../controllers/BedController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

router.get('/', authorizePermissions('beds:read'), BedController.getAllBeds);
router.get('/:id', authorizePermissions('beds:read'), BedController.getBedById);
router.post('/', authorizePermissions('beds:write'), BedController.createBed);
router.put('/:id', authorizePermissions('beds:write'), BedController.updateBed);
router.delete('/:id', authorizePermissions('beds:write'), BedController.deleteBed);

export default router;