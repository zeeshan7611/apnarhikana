import { Router } from 'express';
import RoomController from '../controllers/RoomController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

router.get('/', authorizePermissions('rooms:read'), RoomController.getAllRooms);
router.get('/:id', authorizePermissions('rooms:read'), RoomController.getRoomById);
router.post('/', authorizePermissions('rooms:write'), RoomController.createRoom);
router.put('/:id', authorizePermissions('rooms:write'), RoomController.updateRoom);
router.delete('/:id', authorizePermissions('rooms:write'), RoomController.deleteRoom);

export default router;
