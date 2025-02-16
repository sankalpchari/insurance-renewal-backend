import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
getSettings,
updateSettings
} from "../controllers/settings.controller.js";


const settingsRouter  = express.Router();


settingsRouter.get("/", auth, getSettings);
settingsRouter.post("/", auth,updateSettings);




export default settingsRouter;