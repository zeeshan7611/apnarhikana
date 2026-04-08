/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       required:
 *         - name
 *         - roomCode
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *         name:
 *           type: string
 *           description: Unique name for the room
 *         isActive:
 *           type: boolean
 *           description: Room active status
 *         roomCode:
 *           type: string
 *           description: Room code (custom logic or identifier)
 *       example:
 *         _id: 6613e7c2b1e4a2a1b2c3d4e5
 *         name: Room 101
 *         isActive: true
 *         roomCode: R101
 */
