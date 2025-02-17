import express from "express";
import {
    getDoctors,
    createDoctors,
    updateDoctors,
    getOneDoctor,
    deleteDoctors
} from "../controllers/doctors.controller.js";
import { checkPermission } from "../middleware/common.middleware.js";
import auth from "../middleware/auth.middleware.js";

const doctorRoutes = express.Router();

doctorRoutes.get("/", auth, checkPermission, getDoctors);
doctorRoutes.post("/", auth, checkPermission, createDoctors);
doctorRoutes.patch("/:id", auth, checkPermission, updateDoctors);
doctorRoutes.get("/:id", auth, checkPermission, getOneDoctor);
doctorRoutes.delete("/:id", auth, checkPermission, deleteDoctors);

export default doctorRoutes