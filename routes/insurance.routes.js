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
import { checkPermission } from "../middleware/common.middleware.js";

const insuranceRouter  = express.Router();

insuranceRouter.get("/", auth, checkPermission, getInsuranceDetails);
insuranceRouter.get("/details/:id", auth, checkPermission, singleInsuranceDetails);
insuranceRouter.post("/", auth, checkPermission, validateInsuranceDetails, checkAndCreateDoctor , checkAndCreateRecipient, createInsuranceDetails);
insuranceRouter.patch("/:id", auth, checkPermission, validateInsuranceDetails, checkAndCreateDoctor, checkAndCreateRecipient, updateInsuranceDetails);
insuranceRouter.delete("/:id", auth, checkPermission, deleteInsurance);
insuranceRouter.post("/renew/:type/:id", auth, validateRenewalData,  checkAndCreateDoctor, checkAndCreateRecipient, renewInsurance);
insuranceRouter.post("/send-renewal-mail", auth,  validatePDF,  generateBulkPDF,  sendRenewalEmail, updateStatusInDB);
//Renewal stats
insuranceRouter.get("/renewal-data", auth, getRenewalData);
insuranceRouter.get("/renewal-data/all/:id", auth, getRenewedInsuranceDetails);
// PDF routes 
insuranceRouter.get("/generate-pdf/:id", auth, checkPermission, generatePdf);
insuranceRouter.get("/download-pdf/:id", auth, checkPermission, downloadPDF);
//insurance provider routes
insuranceRouter.get("/provider", auth, checkPermission, insuranceProvider); 
insuranceRouter.get("/provider/:id", auth, checkPermission, singleInsuranceProvider); 

insuranceRouter.post("/provider", 
    auth, 
    checkPermission,
    upload.single("logo"),
    handleUploadError,
    validateProvider, 
    addInsuranceProvider
);

insuranceRouter.patch("/provider/:id", auth, checkPermission, upload.single("logo"), handleUploadError, decryptData, validateProvider,  updateProvider); 
insuranceRouter.delete("/provider/:id", auth, checkPermission, deleteProvider); 

export default insuranceRouter;