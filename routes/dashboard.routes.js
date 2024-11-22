import express from "express";
import {
    getDashboardStats
} from "../controllers/dashboard.controller.js";

import auth from "../middleware/auth.middleware.js";


const dashboardStats = express.Router();


dashboardStats.get("/stats", auth, getDashboardStats)



export default dashboardStats