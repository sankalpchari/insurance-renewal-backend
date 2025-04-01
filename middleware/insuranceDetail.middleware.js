import {
    providerSchema,
    insuranceFormSchema,
    simpleRenewalSchema
} from "../validations/insuranceDetails.validations.js";

import DoctorDetails from "../models/doctors.model.js";
import InsuranceReceipient from "../models/InsuranceReceipient.model.js";
import InsuranceDetails from "../models/insuranceDetails.model.js";
import InsuranceProvider from "../models/InsuranceProvider.model.js";
import {sendMailgunEmail, createEmailBody} from "../services/email.service.js"
import { where, literal, Op } from "sequelize";
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


export const validateInsuranceDetails = async(req, res, next) => {
    const { error } = insuranceFormSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }

    console.log(req.method);
    if(req.method !== 'PATCH'){
        const recipient= await InsuranceReceipient.findOne({
            where:{
                recipient_ma:req.body.recipient_ma
            },
            raw:true
        });
    
    
    
        if(recipient){
            const activeInsurance = await InsuranceDetails.findOne({
                where: {
                    recipient_id: recipient.ID,
                },
                order: [['created_date', 'DESC']],
                raw: true
            });
    
            if (activeInsurance) {
                const newFromDate = new Date(req.body.from_service_date);
                const newToDate = new Date(req.body.to_service_date);
                const existingFromDate = new Date(activeInsurance.from_service_date);
                const existingToDate = new Date(activeInsurance.to_service_date);
                const currentDate = new Date();

                // Check if new request overlaps with the existing insurance period
                if (newFromDate <= existingToDate && newToDate >= existingFromDate) {
                    return res.status(400).json({
                        message: "Service dates overlap with an existing active insurance for this user",
                        success: false
                    });
                }

                // Calculate the difference in days between `to_service_date` and today
                const daysUntilExpiration = Math.ceil((existingToDate - currentDate) / (1000 * 60 * 60 * 24));

                if (daysUntilExpiration > process.env.MAX_NUMBER_OF_DAYS_BEFORE_RENEW) {
                    if (activeInsurance.is_email_sent === 0) {
                        return res.status(400).json({
                            message: "Your previous insurance is yet to be sent for Authorization. Please authorize it first before creating a new Authorization.",
                            success: false
                        });
                    }

                    return res.status(400).json({
                        message: `The insurance you are trying to renew is yet to be expired, ${daysUntilExpiration} days remaining before expiration.`,
                        success: false
                    });
                }else{

                }

            }
        
        }
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
        const { recipient_name:name, recipient_ma, doctor_id, prsrb_prov = "", recipient_is, dob } = req.body;
        const { type } = req.params;

        // Skip validation for simple type
        if (type && type === "simple") {
            return next();
        }

        // Validate required fields
        if (!name || !recipient_ma || !doctor_id || !recipient_is || !dob) {
            return res.status(400).json({ 
                message: "All fields are required: name, recipient_ma, doctor_id, recipient_type, dob" 
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

export const validateRenewalData = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        // Validate ID
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid insurance ID", success: false });
        }

        // Schema validation using a lookup object
        const schemas = {
            simple: simpleRenewalSchema,
            complex: insuranceFormSchema
        };

        const schema = schemas[type];
        if (!schema) {
            return res.status(400).json({ message: "Invalid route selected", success: false });
        }

        // Validate request body against schema
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ 
                errors: error.details.map(detail => detail.message), 
                success: false 
            });
        }

        // Skip further checks for PATCH requests
        if (req.method === "PATCH") {
            return next();
        }

        // Validate date fields
        if (!req.body.from_service_date || !req.body.to_service_date) {
            return res.status(400).json({ message: "Missing service dates", success: false });
        }

        const isValidDate = (date) => !isNaN(new Date(date).getTime());
        if (!isValidDate(req.body.from_service_date) || !isValidDate(req.body.to_service_date)) {
            return res.status(400).json({ message: "Invalid date format", success: false });
        }

        const insuranceUser = await InsuranceDetails.findOne({
            where:{
                id
            },
            raw:true
        })
        // Fetch the active insurance in a single query
        const activeInsurance = await InsuranceDetails.findOne({
            where: {
                recipient_id: insuranceUser.recipient_id
            },
            order: [["created_date", "DESC"]],
            raw: true
        });

        if (!activeInsurance) {
            return next();
        }

        // Convert dates for comparison (ensure they are properly formatted)
        const newFromDate = new Date(req.body.from_service_date);
        const newToDate = new Date(req.body.to_service_date);
        const existingFromDate = new Date(activeInsurance.from_service_date);
        const existingToDate = new Date(activeInsurance.to_service_date);
        const currentDate = new Date();

        // Ensure dates are valid
        if (isNaN(newFromDate.getTime()) || isNaN(newToDate.getTime())) {
            return res.status(400).json({ message: "Invalid service dates provided", success: false });
        }

        // Check if new request overlaps with the existing insurance period
        if (newFromDate < existingToDate && newToDate > existingFromDate) {
            return res.status(400).json({
                message: "Service dates overlap with an existing active insurance for this user",
                success: false
            });
        }

        // Calculate the difference in days between `to_service_date` and today
        const daysUntilExpiration = Math.ceil((existingToDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

        // Ensure `MAX_NUMBER_OF_DAYS_BEFORE_RENEW` is a valid number
        const maxDaysBeforeRenew = Number(process.env.MAX_NUMBER_OF_DAYS_BEFORE_RENEW) || 0;

        if (daysUntilExpiration > maxDaysBeforeRenew) {
            if (!activeInsurance.is_email_sent) { // Handles null or 0
                return res.status(400).json({
                    message: "This insurance is yet to be sent for authorization. Please authorize it first before renewal.",
                    success: false
                });
            }

            return res.status(400).json({
                message: "The insurance you are trying to renew has not yet expired.",
                success: false
            });
        }

        next();
    } catch (error) {
        console.error("Error in validateRenewalData:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};


export const validatePDF = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid request, no IDs provided", success: false });
        }

        const rootPath = process.cwd();

        // Fetch all relevant InsuranceDetails using the `IN` operator
        const insuranceDetails = await InsuranceDetails.findAll({
            where: { ID: { [Op.in]: ids } },  // Use `IN` operator
            attributes: ['ID', 'pdf_location']
        });

        // Convert fetched records into a Map for quick lookup
        const validRecords = new Map(insuranceDetails.map(record => [record.ID, record.pdf_location]));

        const errorIds = [];
        const PDFRoutes = [];
        console.log(validRecords, "<==validRecords")
        // Check file existence in parallel
        await Promise.all(ids.map(async (id) => {
            const pdfLocation = validRecords.get(id);
            if (!pdfLocation) {
                errorIds.push(id);
                return;
            }

            const pdfPath = path.resolve(rootPath, pdfLocation);
            console.log(pdfPath, "<=====pdfPath")
            if (!fs.existsSync(pdfPath)) {
                errorIds.push(id);
            } else {
                PDFRoutes.push(pdfPath);
            }
        }));
        console.log(errorIds, "<==errorIds");
        if (errorIds.length > 0) {
            return res.status(404).json({
                message: "Some PDF files are missing",
                missingFileIds: errorIds,
                success: false
            });
        }

        req.pdfRoutes = PDFRoutes;
        next();

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error occurred while processing data, please check the fields and try again",
            success: false
        });
    }
};


export const validateIfAlreadyApproved = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid request, no IDs provided", success: false });
        }

        // Fetch all relevant InsuranceDetails using the `IN` operator
        const insuranceDetailsList = await InsuranceDetails.findAll({
            where: { ID: { [Op.in]: ids } },
            attributes: ['ID', 'from_service_date', 'to_service_date', 'is_active', 'is_email_sent']
        });

        const currentDate = new Date();
        const alreadyApprovedIds = [];

        for (const insurance of insuranceDetailsList) {
            const { id, from_service_date, to_service_date, is_approved, is_email_sent } = insurance;

            const fromDate = new Date(from_service_date);
            const toDate = new Date(to_service_date);

            // Check if the current date is within the service date range
            const isWithinDateRange = currentDate >= fromDate && currentDate <= toDate;

            // Check if the record is already approved and email has been sent
            if (isWithinDateRange && is_approved === 1 && is_email_sent === 1) {
                alreadyApprovedIds.push(id);
            }
        }

        // If any records are already approved and active, return an error
        if (alreadyApprovedIds.length > 0) {
            return res.status(400).json({
                message: "Some records are already approved and active.",
                alreadyApprovedIds,
                success: false
            });
        }

        // If all checks pass, proceed to the next middleware
        next();

    } catch (error) {
        console.error(error);
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

    
