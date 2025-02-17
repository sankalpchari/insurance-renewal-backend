import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
getUserDetails,
updateUserPassword,
getUsersList,
getUserById,
deleteUser,
createUser,
getRoles,
editUser
} from "../controllers/users.controller.js";
import { passwordValidation, validateUser } from "../middleware/users.middleware.js";
import {checkPermission} from "../middleware/common.middleware.js";

const userRoutes = express.Router();

userRoutes.get("/get-logged-in-user-details", auth, getUserDetails)

userRoutes.post("/update-password", auth, passwordValidation, updateUserPassword)

userRoutes.get("/roles", auth, getRoles);

userRoutes.get("/:id", auth, checkPermission, getUserById);

userRoutes.delete("/:id", auth, checkPermission, deleteUser);

userRoutes.get("/", auth, checkPermission, getUsersList);

userRoutes.post("/", auth, checkPermission, validateUser, createUser);

userRoutes.patch("/:id", auth, checkPermission, validateUser, editUser);

export default userRoutes;
