import { Router } from 'express';
import RbacController from '../controllers/RbacController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RBAC
 *   description: Role and Permission management
 */

/**
 * @swagger
 * /api/rbac/get-roles:
 *   get:
 *     summary: Get all roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 */
router.get('/get-roles', authorizePermissions('users:read'), RbacController.getAllRoles);

/**
 * @swagger
 * /api/rbac/get-permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Permission'
 */
router.get('/get-permissions', authorizePermissions('users:read'), RbacController.getAllPermissions);

/**
 * @swagger
 * /api/rbac/get-role:
 *   get:
 *     summary: Get role details by ID
 *     tags: [RBAC]
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
 *         description: Role details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 */
router.get('/get-role', authorizePermissions('users:read'), RbacController.getRoleById);

/**
 * @swagger
 * /api/rbac/create-role:
 *   post:
 *     summary: Create a new role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleName]
 *             properties:
 *               roleName: { type: string }
 *               description: { type: string }
 *               modulePermission: 
 *                 type: array
 *                 items: 
 *                   type: object
 *                   properties:
 *                     moduleId: { type: string }
 *                     actions: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Role created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 */
router.post('/create-role', authorizePermissions('users:write'), RbacController.createRole);

/**
 * @swagger
 * /api/rbac/update-role:
 *   put:
 *     summary: Update an existing role
 *     tags: [RBAC]
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
 *               id: { type: string }
 *               roleName: { type: string }
 *               description: { type: string }
 *               modulePermission: 
 *                 type: array
 *                 items: 
 *                   type: object
 *                   properties:
 *                     moduleId: { type: string }
 *                     actions: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Role updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 */
router.put('/update-role', authorizePermissions('users:write'), RbacController.updateRole);

/**
 * @swagger
 * /api/rbac/delete-role:
 *   delete:
 *     summary: Delete a role
 *     tags: [RBAC]
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
 *     responses:
 *       200:
 *         description: Role deleted
 */
router.delete('/delete-role', authorizePermissions('users:write'), RbacController.deleteRole);

/**
 * @swagger
 * /api/rbac/assign-role-to-user:
 *   post:
 *     summary: Assign roles to a user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, roleIds]
 *             properties:
 *               userId:
 *                 type: string
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Roles assigned successfully
 */
router.post('/assign-role-to-user', authorizePermissions('users:roles:update'), RbacController.assignRoleToUser);

/**
 * @swagger
 * /api/rbac/bind-permission-to-role:
 *   post:
 *     summary: Bind a permission (module + action) to a role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [moduleId, actions, roleId]
 *             properties:
 *               moduleId:
 *                 type: string
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission bound to role successfully
 */
router.post('/bind-permission-to-role', authorizePermissions('users:roles:update'), RbacController.bindPermissionToRole);

export default router;
