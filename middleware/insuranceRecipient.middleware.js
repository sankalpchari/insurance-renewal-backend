import {recipientValidation} from "../validations/insuranceRecipients.validation.js"
import InsuranceReceipient from "../models/InsuranceReceipient.model.js";

export const validateInsuranceRecipient = async(req, res, next) => {
   
    const { error } = recipientValidation.validate(req.body, { abortEarly: false });
    console.log(error);
    if (error) {
        return res.status(400).json({
            message: "Validation error",
            errors: error.details.map((err) => err.message),
            success:false
        });
    }
    const {recipient_ma} = req.body
    const recipientDetails = await InsuranceReceipient.findOne({
        where:{
            recipient_ma:recipient_ma
        }
    });

    if(recipientDetails){
        return res.status(400).json({
            message: "Provided Recipient MA already exist",
            success:false
        });
    }

    next(); // Move to the next middleware or controller if validation passes
};