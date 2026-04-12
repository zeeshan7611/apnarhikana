import { Router } from 'express';
import PropertyController from '../controllers/PropertyController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

router.get('/', authorizePermissions('properties:read'), PropertyController.getAllProperties);
router.get('/:id', authorizePermissions('properties:read'), PropertyController.getPropertyById);
router.post('/', authorizePermissions('properties:write'), PropertyController.createProperty);
router.put('/:id', authorizePermissions('properties:write'), PropertyController.updateProperty);
router.delete('/:id', authorizePermissions('properties:write'), PropertyController.deleteProperty);

export default router;