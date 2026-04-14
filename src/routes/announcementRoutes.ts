import { Router } from 'express';
import AnnouncementController from '../controllers/AnnouncementController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Tenant announcements and notifications
 */

router.post('/create-announcement', authorizePermissions('announcements:write'), AnnouncementController.create);
router.get('/get-announcements', authorizePermissions('announcements:read'), AnnouncementController.getAll);

export default router;
