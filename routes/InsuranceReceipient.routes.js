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



const InsuranceReceipientRouter  = express.Router();


InsuranceReceipientRouter.get("/", auth, getInsuranceReceipient);
InsuranceReceipientRouter.post("/", auth,validateInsuranceRecipient , checkAndCreateDoctor, createInsuranceRecipient);
InsuranceReceipientRouter.get("/:id", auth, getSingleInsuranceRecipient);
InsuranceReceipientRouter.patch("/:id", auth, validateInsuranceRecipient, checkAndCreateDoctor, updateInsuranceReceipient);
InsuranceReceipientRouter.delete("/:id", auth, deleteInsuranceReceipient);



export default InsuranceReceipientRouter;