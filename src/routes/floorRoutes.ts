import { Router } from 'express';
import FloorController from '../controllers/FloorController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

router.get('/', authorizePermissions('floors:read'), FloorController.getAllFloors);
router.get('/:id', authorizePermissions('floors:read'), FloorController.getFloorById);
router.post('/', authorizePermissions('floors:write'), FloorController.createFloor);
router.put('/:id', authorizePermissions('floors:write'), FloorController.updateFloor);
router.delete('/:id', authorizePermissions('floors:write'), FloorController.deleteFloor);

export default router;