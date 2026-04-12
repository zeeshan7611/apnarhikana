/**
 * @swagger
 * tags:
 *   - name: Auth
 *   - name: Users
 *   - name: Properties
 *   - name: Floors
 *   - name: Rooms
 *   - name: Beds
 *   - name: Inventory
 */

/**
 * @swagger
 * components:
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
 *     CreatePropertyRequest:
 *       type: object
 *       required: [name, address]
 *       properties:
 *         name:
 *           type: string
 *           example: "Hotel Blue Star"
 *         address:
 *           type: string
 *           example: "Mumbai"
 *         description:
 *           type: string
 *
 *     CreateFloorRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           example: "First Floor"
 *
 *     CreateRoomRequest:
 *       type: object
 *       required: [name, roomCode]
 *       properties:
 *         name:
 *           type: string
 *         roomCode:
 *           type: string
 *
 *     CreateBedRequest:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
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
 *           example: 500
 *         status:
 *           type: string
 *           enum: [active, inactive, terminated]
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Email already exists
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory list
 *
 *   post:
 *     summary: Create inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInventoryRequest'
 *     responses:
 *       201:
 *         description: Inventory created
 */

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get inventory by ID
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory found
 *
 *   put:
 *     summary: Update inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated
 *
 *   delete:
 *     summary: Delete inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted successfully
 */