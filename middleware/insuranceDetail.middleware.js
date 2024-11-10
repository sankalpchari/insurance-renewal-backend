import {
    providerSchema,
    insuranceFormSchema
} from "../validations/insuranceDetails.validations.js";

import DoctorDetails from "../models/doctors.model.js";
import InsuranceReceipient from "../models/InsuranceReceipient.model.js";
import { where } from "sequelize";

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


export const checkAndCreateDoctor = async (req, res, next) => {
    try {
        const { doctor_name, doctor_number } = req.body;
        console.log(doctor_name, doctor_number);

        // Search for doctor by phone number
        let doctor = await DoctorDetails.findOne({
            where: {
                doctor_phone_no: doctor_number
            }
        });

        if (doctor) {
            // Doctor found, add doctor_id to req.body
            console.log(doctor.ID)
            req.body.doctor_id = doctor.ID;
        } else {
            // No doctor found, create a new doctor
            doctor = await DoctorDetails.create({
                doctor_name,
                doctor_phone_no: doctor_number,
                is_deleted: false,
                date_created: new Date()
            });

            req.body.doctor_id = doctor.ID; // Add new doctor's ID to req.body
        }

        // Call next middleware
        return next();
    } catch (e) {
        return res.status(500).json({
            message: "Error occurred while processing data, please check the fields and try again",
            success: false
        });
    }
};



export const checkAndCreateRecipient = async (req, res, next) => {
    try {
        const { recipient_ma, recipient_name } = req.body;

        const insuranceRec = await InsuranceReceipient.findOne({
            where:{
                receipient_ma:recipient_ma
            }
        })

        if(insuranceRec){
            req.body.recipient_id = insuranceRec.ID;
        }else{
            const newInsuranceRec = await InsuranceReceipient.create({
                receipient_ma:recipient_ma, 
                name:recipient_name
            })
            req.body.recipient_id = newInsuranceRec.ID; // Add new doctor's ID to req.body
        }
        
        return next();
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Error occurred while processing data, please check the fields and try again",
            success: false
        });
    }
};