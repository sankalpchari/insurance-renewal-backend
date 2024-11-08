import express from "express";
import {
    getInsuranceDetails,
    createInsuranceDetails,
    addInsuranceProvider,
    insuranceProvider,
    deleteProvider,
    updateProvider,
    singleInsuranceProvider
} from "../controllers/insurance.controller.js";

import auth from "../middleware/auth.middleware.js";
import {validateProvider} from "../middleware/insuranceDetail.middleware.js";
import { upload, handleUploadError } from "../config/multer.js";
import {validateInsuranceDetails} from "../middleware/insuranceDetail.middleware.js";

const insuranceRouter  = express.Router();


insuranceRouter.get("/", auth, getInsuranceDetails);
insuranceRouter.post("/", auth, validateInsuranceDetails, createInsuranceDetails);

//insurance provider routes
insuranceRouter.get("/provider", auth, insuranceProvider); 
insuranceRouter.get("/provider/:id", auth, singleInsuranceProvider); 
insuranceRouter.post("/provider", 
    auth, 
    upload.single("logo"),
    handleUploadError,
    validateProvider, 
    addInsuranceProvider
);

insuranceRouter.patch("/provider/:id", auth, upload.single("logo"), handleUploadError, validateProvider,  updateProvider); 
insuranceRouter.delete("/provider/:id", auth, deleteProvider); 

export default insuranceRouter;