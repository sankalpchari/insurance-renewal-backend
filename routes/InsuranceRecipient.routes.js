import express from "express";
import auth from "../middleware/auth.middleware.js";
import { 
    getInsuranceReceipient,
    createInsuranceRecipient,
    deleteInsuranceReceipient,
    getSingleInsuranceRecipient,
    updateInsuranceReceipient,
 } from "../controllers/InsuranceReceipient.controller.js";

import {
checkAndCreateDoctor,
checkAndCreateRecipient
} from "../middleware/insuranceDetail.middleware.js"

import {
 validateInsuranceRecipient
} from "../middleware/insuranceRecipient.middleware.js";

import { checkPermission } from "../middleware/common.middleware.js";


const InsuranceRecipientRouter  = express.Router();


InsuranceRecipientRouter.get("/", auth, checkPermission, getInsuranceReceipient);
InsuranceRecipientRouter.post("/", auth, checkPermission,validateInsuranceRecipient , checkAndCreateDoctor, createInsuranceRecipient);
InsuranceRecipientRouter.get("/:id", auth, checkPermission, getSingleInsuranceRecipient);
InsuranceRecipientRouter.patch("/:id", auth, checkPermission, validateInsuranceRecipient, checkAndCreateDoctor, updateInsuranceReceipient);
InsuranceRecipientRouter.delete("/:id", auth, checkPermission, deleteInsuranceReceipient);



export default InsuranceRecipientRouter;