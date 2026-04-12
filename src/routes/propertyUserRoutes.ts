import { Router } from "express";
import Controller from "../controllers/PropertyUserController";
import { authorizePermissions } from "../middleware/jwtAuth";

const router = Router();

// 🔐 Auth
router.post("/login", Controller.login);

// CRUD (Protected)
router.post(
  "/",
  authorizePermissions("user:create"),
  Controller.createUser
);

router.get(
  "/",
  authorizePermissions("user:read"),
  Controller.getAllUsers
);

router.get(
  "/:id",
  authorizePermissions("user:read"),
  Controller.getUserById
);

router.put(
  "/:id",
  authorizePermissions("user:update"),
  Controller.updateUser
);

router.delete(
  "/:id",
  authorizePermissions("user:delete"),
  Controller.deleteUser
);

export default router;