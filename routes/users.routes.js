import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
getUserDetails,
updateUserPassword,
getUsersList,
getUserById,
deleteUser,
createUser,
getRoles
} from "../controllers/users.controller.js";
import {
    passwordValidation,
    validateUser
} from "../middleware/users.middleware.js";

const userRoutes = express.Router();

userRoutes.get("/get-logged-in-user-details", auth, getUserDetails)

userRoutes.post("/update-password", auth, passwordValidation, updateUserPassword)

userRoutes.get("/roles", auth, getRoles);

userRoutes.get("/:id", auth, getUserById);

userRoutes.delete("/:id", auth, deleteUser);

userRoutes.get("/", auth, getUsersList);

userRoutes.post("/", auth, validateUser, createUser);

export default userRoutes;
