import {recipientValidation} from "../validations/insuranceRecipients.validation.js"

export const validateInsuranceRecipient = (req, res, next) => {
    const { error } = recipientValidation.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            message: "Validation error",
            details: error.details.map((err) => err.message),
        });
    }

    next(); // Move to the next middleware or controller if validation passes
};