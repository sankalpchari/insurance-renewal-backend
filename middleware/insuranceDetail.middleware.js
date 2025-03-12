import {
    providerSchema,
    insuranceFormSchema,
    simpleRenewalSchema
} from "../validations/insuranceDetails.validations.js";

import DoctorDetails from "../models/doctors.model.js";
import InsuranceReceipient from "../models/InsuranceReceipient.model.js";
import InsuranceDetails from "../models/insuranceDetails.model.js";
import InsuranceProvider from "../models/InsuranceProvider.model.js";
import {sendMailgunEmail} from "../services/email.service.js"
import { where } from "sequelize";
import fs from 'fs';
import path from 'path';

export const validateProvider = (req, res, next) => {
    const { error } = providerSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }
    next();
};


export const validateInsuranceDetails = (req, res, next) => {
    const { error } = insuranceFormSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }
    next();
};


export const checkAndCreateDoctor = async (req, res, next) => {
    try {
        const { doctor_name = "", doctor_number = "" } = req.body;
        const { type } = req.params;
 
        if(type && type == "simple" || (doctor_name == "" && doctor_number == "")){
           return next();
        }


        // Search for doctor by phone number
        let doctor = await DoctorDetails.findOne({
            where: {
                doctor_phone_no: doctor_number
            }
        });

        if (doctor) {
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
        console.log(e);
        return res.status(500).json({
            message: "Error occurred while processing data, please check the fields and try again",
            success: false
        });
    }
};



export const checkAndCreateRecipient = async (req, res, next) => {
    try {
        const { recipient_name:name, recipient_ma, doctor_id, prsrb_prov, recipient_is, dob } = req.body;
        const { type } = req.params;

        // Skip validation for simple type
        if (type && type === "simple") {
            return next();
        }

        // Validate required fields
        if (!name || !recipient_ma || !doctor_id || !prsrb_prov || !recipient_is || !dob) {
            return res.status(400).json({ 
                message: "All fields are required: name, recipient_ma, doctor_id, prsrb_prov, recipient_type, dob" 
            });
        }

        // Check if recipient exists
        const insuranceRec = await InsuranceReceipient.findOne({
            where: {
                recipient_ma: recipient_ma
            }
        });

        if (insuranceRec) {
            // Check if any fields need updating
            const updates = {};
            if (name !== insuranceRec.name) updates.name = name;
            if (doctor_id !== insuranceRec.doctor_id) updates.doctor_id = doctor_id;
            if (prsrb_prov !== insuranceRec.prsrb_prov) updates.prsrb_prov = prsrb_prov;
            if (recipient_is !== insuranceRec.recipient_type) updates.recipient_type = recipient_is;
            if (dob !== insuranceRec.dob) updates.dob = dob;

            // If there are updates, apply them
            if (Object.keys(updates).length > 0) {
                await insuranceRec.update(updates);
            }

            req.body.recipient_id = insuranceRec.ID;
        } else {
            // Create new recipient if doesn't exist
            const newRecipient = await InsuranceReceipient.create({
                name,
                recipient_ma,
                doctor_id,
                prsrb_prov,
                recipient_type : recipient_is,
                dob
            });
            req.body.recipient_id = newRecipient.ID;
        }

        return next();
    } catch (e) {
        console.error('Error in checkAndCreateRecipient:', e);
        return res.status(500).json({
            message: "Error occurred while processing data, please check the fields and try again",
            success: false
        });
    }
};


export const validateRenewalData = (req, res, next) => {

    const {type} = req.params;
    
    if(type == "simple"){
        const { error } = simpleRenewalSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }   
    }else if(type == "complex"){
        const { error } = insuranceFormSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({ errors: errorMessages });
        }
    }else{
        return res.status(400).json({ "message":"Invalid route selected" });
    }

    next();
};

export const validatePDF = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const errorIds = [];
        const PDFRoutes = [];
        const rootPath = process.cwd();
        for (const id of ids) {
            // Find the InsuranceDetails record for the given ID
            const insuranceDetail = await InsuranceDetails.findOne({ where: { id } });

            // Check if insuranceDetail exists and has a valid pdf_location
            if (insuranceDetail && insuranceDetail.pdf_location) {
                const pdfPath = path.resolve(path.join(rootPath, insuranceDetail.pdf_location));

                // Check if the file exists
                if (!fs.existsSync(pdfPath)) {
                    // Add ID to errorIds if file doesn't exist
                    errorIds.push(id);
                } else {
                    // Add the valid PDF path to PDFRoutes
                    PDFRoutes.push(pdfPath);
                }
            } else {
                // Add ID to errorIds if insuranceDetail or pdf_location is missing
                errorIds.push(id);
            }
        }

        // If there are any errors, return a response with the missing file IDs
        if (errorIds.length > 0) {
            return res.status(404).json({
                message: "Some PDF files are missing",
                missingFileIds: errorIds,
                success: false
            });
        }

        // Attach PDFRoutes to req for the next middleware
        req.pdfRoutes = PDFRoutes;

        // If all files exist, proceed to the next middleware
        next();

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Error occurred while processing data, please check the fields and try again",
            success: false
        });
    }
};


export const sendRenewalEmail = async(req, res, next)=>{
    try {

        const { combinedPdfPath, emailRecipient } = req; // `combinedPdfPath` and `emailRecipient` should be set in previous middleware
        
        const insuranceProvider = await InsuranceProvider.findOne({
            where:{
                is_default : 1
            },
            raw:true
        });

        if(insuranceProvider && insuranceProvider?.provider_email){
        // Check if combined PDF path exists
        if (!combinedPdfPath || !fs.existsSync(combinedPdfPath)) {
            return res.status(400).json({
              message: "Combined PDF file not found",
              success: false
            });
          }
      
          const emailBody = createEmailBody("notifyInsuranceProvider", {});

          // Define email options
          const emailOptions = {
            to: insuranceProvider.provider_email,
            subject: "Client Authorization PDF Document",
            html: emailBody,
            attachments: [
              {
                filename: path.basename(combinedPdfPath),
                path: combinedPdfPath
              }
            ]
          };
      
          // Send the email
          const response = await sendMailgunEmail(emailOptions);
          
          req.emailResp = response;
  
          next();
        }else{
           return res.status(400).json({
                message: "Insurance Provider not set, please make changes to the provider and try again",
                success: false
              });  
        }
      } catch (error) {
        console.error("Failed to send email with PDF:", error.message);
       return res.status(500).json({
          message: "Failed to send email",
          success: false
        });
      }
};

    
