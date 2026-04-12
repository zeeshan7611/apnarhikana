/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         roleIds:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Role'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Permission:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         resource:
 *           type: string
 *         action:
 *           type: string
 *
 *     Role:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         permissionIds:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *
 *     RegisterRequest:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     Property:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreatePropertyRequest:
 *       type: object
 *       required: [name, address]
 *       properties:
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         description:
 *           type: string
 *
 *     Floor:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         propertyId:
 *           type: string
 *         name:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     CreateFloorRequest:
 *       type: object
 *       required: [propertyId, name]
 *       properties:
 *         propertyId:
 *           type: string
 *         name:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     Room:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         propertyId:
 *           type: string
 *         floorId:
 *           type: string
 *         name:
 *           type: string
 *         roomCode:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     CreateRoomRequest:
 *       type: object
 *       required: [propertyId, floorId, name, roomCode]
 *       properties:
 *         propertyId:
 *           type: string
 *         floorId:
 *           type: string
 *         name:
 *           type: string
 *         roomCode:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     Bed:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         roomId:
 *           type: string
 *         name:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     CreateBedRequest:
 *       type: object
 *       required: [roomId, name]
 *       properties:
 *         roomId:
 *           type: string
 *         name:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     Inventory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         propertyId:
 *           type: string
 *         floorId:
 *           type: string
 *         roomId:
 *           type: string
 *         beds:
 *           type: string
 *           description: Bed ID
 *         BedBasePrice:
 *           type: number
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, terminated]
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 *
 *     CreateInventoryRequest:
 *       type: object
 *       required: [propertyId, floorId, roomId, beds, BedBasePrice]
 *       properties:
 *         propertyId:
 *           type: string
 *         floorId:
 *           type: string
 *         roomId:
 *           type: string
 *         beds:
 *           type: string
 *         BedBasePrice:
 *           type: number
 *           example: 5000
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, terminated]
 *
 *     UpdateInventoryRequest:
 *       type: object
 *       properties:
 *         BedBasePrice:
 *           type: number
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, terminated]
 */