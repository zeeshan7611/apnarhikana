import { Router } from 'express';
import ExpenseController from '../controllers/ExpenseController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Property expense management
 */

router.post('/create-expense', authorizePermissions('expenses:write'), ExpenseController.create);
router.get('/get-expenses', authorizePermissions('expenses:read'), ExpenseController.getAll);
router.get('/get-expense', authorizePermissions('expenses:read'), ExpenseController.getById);
router.put('/update-expense', authorizePermissions('expenses:write'), ExpenseController.update);
router.delete('/delete-expense', authorizePermissions('expenses:delete'), ExpenseController.delete);

export default router;
