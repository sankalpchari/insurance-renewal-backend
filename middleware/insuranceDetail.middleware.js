import {
    providerSchema,
    insuranceFormSchema
} from "../validations/insuranceDetails.validations.js";

export const validateProvider = (req, res, next) => {
    const { error } = providerSchema.validate(req.body, { abortEarly: false });
    if (error) {
        console.log("eror")
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }
    next();
};


export const validateInsuranceDetails = (req, res, next) => {
    const { error } = insuranceFormSchema.validate(req.body, { abortEarly: false });
    if (error) {
        console.log("eror")
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }
    next();
};