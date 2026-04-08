/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management
 *   - name: Properties
 *     description: Property management
 *   - name: Floors
 *     description: Floor management
 *   - name: Beds
 *     description: Bed management
 *   - name: Allocations
 *     description: Allocation management
 *   - name: Rooms
 *     description: Room management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 *
 * /properties:
 *   get:
 *     summary: Get all properties
 *     tags: [Properties]
 *     responses:
 *       200:
 *         description: List of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Property'
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       201:
 *         description: Property created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *
 * /properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 *   put:
 *     summary: Update property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       200:
 *         description: Property updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 *   delete:
 *     summary: Delete property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted
 *       404:
 *         description: Property not found
 *
 * /floors:
 *   get:
 *     summary: Get all floors
 *     tags: [Floors]
 *     responses:
 *       200:
 *         description: List of floors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Floor'
 *   post:
 *     summary: Create a new floor
 *     tags: [Floors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Floor'
 *     responses:
 *       201:
 *         description: Floor created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Floor'
 *
 * /floors/{id}:
 *   get:
 *     summary: Get floor by ID
 *     tags: [Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor ID
 *     responses:
 *       200:
 *         description: Floor data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Floor'
 *       404:
 *         description: Floor not found
 *   put:
 *     summary: Update floor
 *     tags: [Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Floor'
 *     responses:
 *       200:
 *         description: Floor updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Floor'
 *       404:
 *         description: Floor not found
 *   delete:
 *     summary: Delete floor
 *     tags: [Floors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor ID
 *     responses:
 *       200:
 *         description: Floor deleted
 *       404:
 *         description: Floor not found
 *
 * /beds:
 *   get:
 *     summary: Get all beds
 *     tags: [Beds]
 *     responses:
 *       200:
 *         description: List of beds
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bed'
 *   post:
 *     summary: Create a new bed
 *     tags: [Beds]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bed'
 *     responses:
 *       201:
 *         description: Bed created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bed'
 *
 * /beds/{id}:
 *   get:
 *     summary: Get bed by ID
 *     tags: [Beds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bed ID
 *     responses:
 *       200:
 *         description: Bed data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bed'
 *       404:
 *         description: Bed not found
 *   put:
 *     summary: Update bed
 *     tags: [Beds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bed ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Bed'
 *     responses:
 *       200:
 *         description: Bed updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bed'
 *       404:
 *         description: Bed not found
 *   delete:
 *     summary: Delete bed
 *     tags: [Beds]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bed ID
 *     responses:
 *       200:
 *         description: Bed deleted
 *       404:
 *         description: Bed not found
 *
 * /allocations:
 *   get:
 *     summary: Get all allocations
 *     tags: [Allocations]
 *     responses:
 *       200:
 *         description: List of allocations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Allocation'
 *   post:
 *     summary: Create a new allocation
 *     tags: [Allocations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Allocation'
 *     responses:
 *       201:
 *         description: Allocation created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Allocation'
 *
 * /allocations/{id}:
 *   get:
 *     summary: Get allocation by ID
 *     tags: [Allocations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Allocation ID
 *     responses:
 *       200:
 *         description: Allocation data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Allocation'
 *       404:
 *         description: Allocation not found
 *   put:
 *     summary: Update allocation
 *     tags: [Allocations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Allocation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Allocation'
 *     responses:
 *       200:
 *         description: Allocation updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Allocation'
 *       404:
 *         description: Allocation not found
 *   delete:
 *     summary: Delete allocation
 *     tags: [Allocations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Allocation ID
 *     responses:
 *       200:
 *         description: Allocation deleted
 *       404:
 *         description: Allocation not found
 *
 * /rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       201:
 *         description: Room created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *
 * /rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 *   put:
 *     summary: Update room
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       200:
 *         description: Room updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 *   delete:
 *     summary: Delete room
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room deleted
 *       404:
 *         description: Room not found
 */
