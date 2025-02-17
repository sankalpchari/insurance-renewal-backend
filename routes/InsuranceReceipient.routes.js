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


const InsuranceReceipientRouter  = express.Router();


InsuranceReceipientRouter.get("/", auth, checkPermission, getInsuranceReceipient);
InsuranceReceipientRouter.post("/", auth, checkPermission,validateInsuranceRecipient , checkAndCreateDoctor, createInsuranceRecipient);
InsuranceReceipientRouter.get("/:id", auth, checkPermission, getSingleInsuranceRecipient);
InsuranceReceipientRouter.patch("/:id", auth, checkPermission, validateInsuranceRecipient, checkAndCreateDoctor, updateInsuranceReceipient);
InsuranceReceipientRouter.delete("/:id", auth, checkPermission, deleteInsuranceReceipient);



export default InsuranceReceipientRouter;