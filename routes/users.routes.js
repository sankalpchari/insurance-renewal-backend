import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
getUserDetails
} from "../controllers/users.controller.js";


const userRoutes = express.Router();


userRoutes.get("/get-logged-in-user-details", auth, getUserDetails)



export default userRoutes;
