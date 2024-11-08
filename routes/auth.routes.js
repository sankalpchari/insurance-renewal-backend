import express from "express";
import {
    loginUser,
    signup,
    logout
} from "../controllers/auth.controller.js";

const authRouter = express.Router();


authRouter.post("/login", loginUser);
authRouter.post("/signup", signup);
authRouter.post("/logout", logout);

export default authRouter;