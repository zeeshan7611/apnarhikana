import { Router } from 'express';
import BedController from '../controllers/BedController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get all beds
router.post('/beds/list', authenticate, BedController.getAllBeds);
// Get a bed by ID (send { bedId } in body)
router.post('/beds/get', authenticate, BedController.getBedById);
// Create a new bed
router.post('/beds/create', authenticate, authorize('manager', 'admin'), BedController.createBed);
// Update a bed (send { bedId, ...fields } in body)
router.post('/beds/update', authenticate, authorize('manager', 'admin'), BedController.updateBed);
// Delete a bed (send { bedId } in body)
router.post('/beds/delete', authenticate, authorize('admin'), BedController.deleteBed);

export default router;