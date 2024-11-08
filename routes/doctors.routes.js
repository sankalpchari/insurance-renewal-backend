import express from "express";
import {
    getDoctors,
    createDoctors,
    updateDoctors,
    getOneDoctor,
    deleteDoctors
} from "../controllers/doctors.controller.js";

import auth from "../middleware/auth.middleware.js";

const doctorRoutes = express.Router();

doctorRoutes.get("/", auth, getDoctors);
doctorRoutes.post("/", auth, createDoctors);
doctorRoutes.patch("/:id", auth, updateDoctors);
doctorRoutes.get("/:id", auth, getOneDoctor);
doctorRoutes.delete("/:id", auth, deleteDoctors);

export default doctorRoutes