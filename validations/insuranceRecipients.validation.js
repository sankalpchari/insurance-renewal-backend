import Joi from 'joi';

export const recipientValidation = Joi.object({
    name: Joi.string()
        .trim()
        .pattern(/^[A-Za-z\s]+$/)
        .required()
        .messages({
            "string.pattern.base": "Name can only contain alphabets and spaces."
        }),
    recipient_ma: Joi.string().trim().required(),
    doctor_name: Joi.string().trim().optional().allow(''),
    doctor_number: Joi.string()
        .trim()
        .optional()
        .allow('')
        .pattern(/^(?:1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}(?:\s?(?:x|ext\.?)\s?\d+)?$/i)
        .messages({
            "string.pattern.base": "Invalid phone number format. Examples: (123) 456-7890, 123-456-7890, +1 123-456-7890, 1-224-966-3668 x6165, or with 'ext.'"
        }),
    prsrb_prov: Joi.string().trim().optional().allow(''),
    recipient_type: Joi.string().valid("MW", "REM", "REM OPT").required(),
    dob: Joi.date().iso().required(),
});
