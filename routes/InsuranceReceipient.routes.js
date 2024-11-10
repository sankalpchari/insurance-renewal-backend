import express from "express";
import auth from "../middleware/auth.middleware.js";
import { 
    getInsuranceReceipient,
    createInsuranceReceipient,
    deleteInsuranceReceipient,
    getSingleInsuranceRecipient,
    updateInsuranceReceipient,
 } from "../controllers/InsuranceReceipient.controller.js";
const InsuranceReceipientRouter  = express.Router();


InsuranceReceipientRouter.get("/", auth, getInsuranceReceipient);
InsuranceReceipientRouter.post("/", auth, createInsuranceReceipient);
InsuranceReceipientRouter.get("/:id", auth, getSingleInsuranceRecipient);
InsuranceReceipientRouter.patch("/:id", auth, updateInsuranceReceipient);
InsuranceReceipientRouter.delete("/:id", auth, deleteInsuranceReceipient);

export default InsuranceReceipientRouter;