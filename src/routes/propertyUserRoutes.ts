import { Router } from "express";
import Controller from "../controllers/PropertyUserController";
import { authorizePermissions, jwtAuth } from "../middleware/jwtAuth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: PropertyUsers
 *   description: Property user management operations
 */

/**
 * @swagger
 * /api/property-users/login-property-user:
 *   post:
 *     summary: Login for property users
 *     tags: [PropertyUsers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login-property-user", Controller.login);

// CRUD (Protected via internal jwtAuth)
router.use(jwtAuth);

/**
 * @swagger
 * /api/property-users/create-property-user:
 *   post:
 *     summary: Create a property user
 *     tags: [PropertyUsers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               roleIds: { type: array, items: { type: string } }
 *               phoneNumber: { type: string }
 *               education: { type: string }
 *               designation: { type: string }
 *               joiningDate: { type: string, format: date }
 *               monthlySalary: { type: number }
 *               isActive: { type: boolean }
 *               kycDocument:
 *                 type: object
 *                 properties:
 *                   adharCard: { type: string }
 *                   panCard: { type: string }
 *                   drivingLicense: { type: string }
 *     responses:
 *       201:
 *         description: Property User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyUser'
 */
router.post("/create-property-user", authorizePermissions("users:write"), Controller.createUser);

/**
 * @swagger
 * /api/property-users/get-property-users:
 *   get:
 *     summary: Get all property users
 *     tags: [PropertyUsers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of property users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PropertyUser'
 */
router.get("/get-property-users", authorizePermissions("users:read"), Controller.getAllUsers);

/**
 * @swagger
 * /api/property-users/get-property-user:
 *   get:
 *     summary: Get property user by ID
 *     tags: [PropertyUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyUser'
 */
router.get("/get-property-user", authorizePermissions("users:read"), Controller.getUserById);

/**
 * @swagger
 * /api/property-users/update-property-user:
 *   put:
 *     summary: Update property user
 *     tags: [PropertyUsers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string, description: User ID }
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               roleIds: { type: array, items: { type: string } }
 *               phoneNumber: { type: string }
 *               education: { type: string }
 *               designation: { type: string }
 *               joiningDate: { type: string, format: date }
 *               monthlySalary: { type: number }
 *               isActive: { type: boolean }
 *               kycDocument:
 *                 type: object
 *                 properties:
 *                   adharCard: { type: string }
 *                   panCard: { type: string }
 *                   drivingLicense: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyUser'
 */
router.put("/update-property-user", authorizePermissions("users:write"), Controller.updateUser);

/**
 * @swagger
 * /api/property-users/delete-property-user:
 *   delete:
 *     summary: Delete property user
 *     tags: [PropertyUsers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/delete-property-user", authorizePermissions("users:delete"), Controller.deleteUser);

export default router;