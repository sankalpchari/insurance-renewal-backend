import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
getSettings,
updateSettings
} from "../controllers/settings.controller.js";

import { checkPermission } from "../middleware/common.middleware.js";


const settingsRouter  = express.Router();


settingsRouter.get("/", auth,checkPermission, getSettings);
settingsRouter.post("/", auth,checkPermission, updateSettings);




export default settingsRouter;