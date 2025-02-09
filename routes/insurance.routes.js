import express from "express";
import {
    getInsuranceDetails,
    createInsuranceDetails,
    deleteInsurance,
    updateInsuranceDetails,
    singleInsuranceDetails,
    addInsuranceProvider,
    insuranceProvider,
    deleteProvider,
    updateProvider,
    singleInsuranceProvider,
    generatePdf, 
    renewInsurance,
    downloadPDF,
    updateStatusInDB,
    getRenewalData,
    getRenewedInsuranceDetails
} from "../controllers/insurance.controller.js";

import auth from "../middleware/auth.middleware.js";
import {
    validateProvider , 
    validateInsuranceDetails, 
    checkAndCreateDoctor, 
    checkAndCreateRecipient,
    validateRenewalData,
    validatePDF,
    sendRenewalEmail
} from "../middleware/insuranceDetail.middleware.js";
import { upload, handleUploadError } from "../config/multer.js";
import {generateBulkPDF} from "../services/pdfService.js";
import { decryptData } from "../config/dataEncryption.js";

const insuranceRouter  = express.Router();

insuranceRouter.get("/", auth, getInsuranceDetails);
insuranceRouter.get("/details/:id", auth, singleInsuranceDetails);
insuranceRouter.post("/", auth, validateInsuranceDetails, checkAndCreateDoctor , checkAndCreateRecipient, createInsuranceDetails);
insuranceRouter.patch("/:id", auth, validateInsuranceDetails, checkAndCreateDoctor, checkAndCreateRecipient, updateInsuranceDetails);
insuranceRouter.delete("/:id", auth, deleteInsurance);

insuranceRouter.post("/renew/:type/:id", auth, validateRenewalData,  checkAndCreateDoctor, checkAndCreateRecipient, renewInsurance);
insuranceRouter.post("/send-renewal-mail", auth,  validatePDF,  generateBulkPDF,  sendRenewalEmail, updateStatusInDB);

//Renewal stats
insuranceRouter.get("/renewal-data", auth, getRenewalData);

insuranceRouter.get("/renewal-data/all/:id", auth, getRenewedInsuranceDetails);

// PDF routes 
insuranceRouter.get("/generate-pdf/:id", auth, generatePdf);
insuranceRouter.get("/download-pdf/:id", auth, downloadPDF);


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

insuranceRouter.patch("/provider/:id", auth, upload.single("logo"), handleUploadError, decryptData, validateProvider,  updateProvider); 
insuranceRouter.delete("/provider/:id", auth, deleteProvider); 

export default insuranceRouter;