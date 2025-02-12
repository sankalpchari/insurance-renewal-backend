import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
getUserDetails,
updateUserPassword,
getUsersList,
getUserById,
deleteUser
} from "../controllers/users.controller.js";
import {
    passwordValidation
} from "../middleware/users.middleware.js";

const userRoutes = express.Router();


userRoutes.get("/get-logged-in-user-details", auth, getUserDetails)
userRoutes.post("/update-password", auth, passwordValidation, updateUserPassword)
userRoutes.get("/", auth, getUsersList);
userRoutes.get("/:id", auth, getUserById);
userRoutes.delete("/:id", auth, deleteUser);

export default userRoutes;
