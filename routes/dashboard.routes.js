import express from "express";
import {
    getDashboardStats
} from "../controllers/dashboard.controller.js";

import auth from "../middleware/auth.middleware.js";
import { checkPermission } from "../middleware/common.middleware.js";

const dashboardStats = express.Router();


dashboardStats.get("/stats", auth, checkPermission, getDashboardStats)



export default dashboardStats