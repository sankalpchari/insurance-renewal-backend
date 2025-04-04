import InsuranceDetails from "../models/insuranceDetails.model.js";
import InsuranceProvider from "../models/InsuranceProvider.model.js";
import DoctorDetails from "../models/doctors.model.js";
import InsuranceReceipient from "../models/InsuranceReceipient.model.js";
import User from "../models/users.model.js" 
import sequelize,{ fn, col, where, json , Op, literal} from "sequelize";
import { raw } from "mysql2";
import { generatePDF , deleteFile} from "../services/pdfService.js";
import EmailStatus from "../models/emailStatus.model.js";
import { sendMailgunEmail , createEmailBody} from "../services/email.service.js";
import {getRecordType} from "../utils/helpers.js";
import Settings from "../models/setting.model.js";
import path from "path";
import fs from "fs"

const rootPath = process.cwd();

export const getInsuranceDetails = async (req, res) => {
    try {
        const {
            searchTerm,
            fromDate,
            toDate,
            is_active,
            is_email_sent,
            sortBy = 'date',  
            sortOrder = 'asc', 
            recordsPerPage = 10, 
            page = 1, 
            is_default, 
            is_draft,
            searchType = "",
            recordsType = "",
            dueIn
        } = req.query;

        let whereData = { where: {} };
        let order = [];
        let attributes = [];
        const currentDate = new Date();

        // Process `dueIn` filter
        if (dueIn) {
            const match = dueIn.match(/^(\d+)([dwmy])$/); // Extract number & unit
            if (match) {
                const value = parseInt(match[1], 10);
                const unit = match[2];

                let dateCondition;
                switch (unit) {
                    case "d": // Days
                        dateCondition = new Date();
                        dateCondition.setDate(currentDate.getDate() + value);
                        break;
                    case "w": // Weeks
                        dateCondition = new Date();
                        dateCondition.setDate(currentDate.getDate() + value * 7);
                        break;
                    case "m": // Months
                        dateCondition = new Date();
                        dateCondition.setMonth(currentDate.getMonth() + value);
                        break;
                    default:
                        dateCondition = null;
                }

                if (dateCondition) {
                    if (dueIn === "0d") {
                        whereData.where.to_service_date = { [sequelize.Op.lt]: currentDate }; // Expired
                    } else {
                        whereData.where.to_service_date = {
                            [sequelize.Op.between]: [currentDate, dateCondition]
                        };
                    }
                }
            }
        }

        // Other filters
        if (is_default) whereData.where.is_default = is_default;
        if (is_active) whereData.where.is_active = { [sequelize.Op.eq]: 1 };
        if (is_email_sent) whereData.where.is_email_sent = { [sequelize.Op.eq]: is_email_sent };
        if (is_draft) whereData.where.is_draft = { [sequelize.Op.eq]: is_draft };



        if (searchTerm) {
            whereData.where[sequelize.Op.or] = [
                { '$InsuranceReceipient.name$': { [sequelize.Op.like]: `%${searchTerm}%` } },
                { '$InsuranceReceipient.recipient_ma$': { [sequelize.Op.like]: `%${searchTerm}%` } }
            ];
        }

        if (fromDate && toDate) {
            whereData.where.from_service_date = { [sequelize.Op.between]: [fromDate, toDate] };
        } else if (fromDate) {
            whereData.where.from_service_date = { [sequelize.Op.gte]: fromDate };
        } else if (toDate) {
            whereData.where.from_service_date = { [sequelize.Op.lte]: toDate };
        }

        switch (searchType) {
            case "upcoming":
                attributes.push([sequelize.literal('DATEDIFF(to_service_date, NOW())'), 'daysUntilExpiry']);
                whereData.where = { 
                    ...whereData.where, 
                    to_service_date: { [sequelize.Op.gte]: currentDate }, 
                    is_draft: 0,
                    is_email_sent: 0, 
                    is_active: 1 
                };
                order.push([sequelize.literal('DATEDIFF(to_service_date, NOW())'), 'ASC']);
                break;
        
            case "recent":
                attributes.push([sequelize.literal('DATEDIFF(NOW(), from_service_date)'), 'daysSinceRenewal']);
                whereData.where = { 
                    ...whereData.where, 
                    is_email_sent: 1, 
                    is_active: 1 
                };
                order.push([sequelize.literal('DATEDIFF(NOW(), from_service_date)'), 'ASC']);
                break;
        
            case "expired":
                attributes.push([sequelize.literal('DATEDIFF(NOW(), to_service_date)'), 'days_passed']);
                whereData.where = { 
                    ...whereData.where, 
                    to_service_date: { [sequelize.Op.lt]: currentDate },
                    is_draft: 0, 
                };
                break;
        
            default:
                attributes.push([sequelize.literal('DATEDIFF(NOW(), to_service_date)'), 'days_passed']);
                // No special filtering
        }
        

        switch (sortBy) {
            case 'date':
                order.push(['from_service_date', sortOrder]);
                break;
            case 'name':
                order.push([sequelize.col('InsuranceReceipient.name'), sortOrder]);
                break;
            case 'created_date':
                order.push(['created_date', sortOrder]);
                break;
        }


        whereData.where = {
            ...whereData.where,
            created_date: {
                [sequelize.Op.eq]: sequelize.literal(`(
                    SELECT MAX(created_date) 
                    FROM insurance_details AS subquery 
                    WHERE subquery.recipient_id = InsuranceDetails.recipient_id
                )`)
            }
        }

        const limit = parseInt(recordsPerPage);
        const offset = (parseInt(page) - 1) * limit;

        const { rows: insuranceDetails, count: totalRecords } = await InsuranceDetails.findAndCountAll({
            include: [
                { model: InsuranceProvider, as: 'InsuranceProvider', attributes: ['provider_name'], required: true },
                { model: InsuranceReceipient, as: 'InsuranceReceipient', required: true }
            ],
            attributes: {
                include: [
                    ...attributes,
                    [sequelize.col('InsuranceProvider.provider_name'), 'provider_name'],
                    [sequelize.col('InsuranceReceipient.name'), 'recipient_name'],
                    [sequelize.col('InsuranceReceipient.recipient_ma'), 'recipient_ma'],
                    [sequelize.fn('DATE_FORMAT', sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'],
                    [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date'],
                    [
                        sequelize.literal(`CASE WHEN record_type = 1 THEN 'Insurance' WHEN record_type = 2 THEN 'Template' ELSE 'Unknown' END`),
                        'record_type_label'
                    ]
                ]
            },
            where: whereData.where,
            order: order,
            group: ['recipient_id'],
            limit: limit,
            offset: offset,
            raw: true
        });

        const totalPages = Math.ceil(totalRecords / limit);

        return res.status(200).json({
            data: insuranceDetails,
            pagination: {
                totalRecords,
                totalPages,
                recordsPerPage: limit,
                currentPage: parseInt(page)
            },
            message: "Data fetched successfully",
            success: true
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Failed to get insurance details",
            success: false
        });
    }
};



export const createInsuranceDetails = async (req, res) => {
    try {

        console.log("=========================> testing full flow <========================")

        const {
            provider_id,
            recipient_id,
            prsrb_prov,
            pa,
            from_service_date,
            to_service_date,
            recipient_is,
            procedure_code,
            global_hours_per_week,
            units,
            sender_date,
            plan_of_care,
            number_of_days,
            max_per_day,
            max_per_day_unit,
            insurance_status,
            mmis_entry,
            rsn,
            comment_pa,
            procedure_units,
            save_type
        } = req.body;

        // Check for existing insurance details for this recipient with overlapping dates
        // const existingDetails = await InsuranceDetails.findOne({
        //     where: {
        //         recipient_id,
        //         to_service_date: {
        //             [sequelize.Op.gte]: from_service_date // to_service_date is greater than or equal to new from_service_date
        //         },
        //         from_service_date: {
        //             [sequelize.Op.lte]: to_service_date // from_service_date is less than or equal to new to_service_date
        //         },
        //         is_active: true // Only check for active contracts
        //     }
        // });

        // If an existing entry is found, update it
        // if (existingDetails) {
        //     // Update the old entry to set is_current_active to 0
        //     await InsuranceDetails.update(
        //         { is_active: false }, // Set the old entry to inactive
        //         { where: { ID: existingDetails.ID } }
        //     );
        // }


        let record_type = getRecordType(save_type);
        let is_draft = 0;
        if(save_type == "draft"){
            is_draft = 1;
        }else{
            is_draft = 0;
        }

    
        // Create a new insurance detail entry
        const newInsuranceDetail = await InsuranceDetails.create({
            provider_id,
            recipient_id,
            prsrb_prov,
            pa,
            from_service_date,
            to_service_date,
            recipient_is,
            procedure_code,
            units:procedure_units,
            plan_of_care,
            number_of_days,
            sender_date,
            global_hours_per_week,
            max_per_day,
            max_per_day_unit,
            insurance_status,
            mmis_entry,
            rsn,
            comment_pa,
            is_active: 0,
            record_type,
            is_draft
        });

        let message = "New insurance created successfully"
        if(is_draft){
            message = "New insurance saved as draft successfully"
        }

        console.log(message, "message");

        return res.status(201).json({
            data:newInsuranceDetail, 
            success:true, 
            "message":message
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Failed to create insurance details",
            success:false
        });
    }
};



export const updateInsuranceDetails = async (req, res) => {
    try {
        const {
            provider_id,
            recipient_id,
            prsrb_prov,
            pa,
            from_service_date,
            to_service_date,
            recipient_is,
            procedure_code,
            units,
            sender_date,
            plan_of_care,
            number_of_days,
            global_hours_per_week,
            max_per_day,
            max_per_day_unit,
            insurance_status,
            mmis_entry,
            rsn,
            comment_pa,
            procedure_val,
            recipient_ma,
            save_type
        } = req.body;

        const {id} = req.params; 

        let is_draft = 0;
        if(save_type == "draft"){
            is_draft = 1;
        }else{
            is_draft = 0;
        }

        // Create a new insurance detail entry
        const newInsuranceDetail = await InsuranceDetails.update({
            provider_id,
            recipient_id,
            prsrb_prov,
            pa,
            from_service_date,
            global_hours_per_week,
            to_service_date,
            recipient_is,
            procedure_code,
            units:procedure_val,
            plan_of_care,
            number_of_days,
            max_per_day,
            sender_date,
            max_per_day_unit,
            insurance_status,
            mmis_entry,
            rsn,
            comment_pa,
            is_draft
        },{
            where: { ID: id }
        });

        return res.status(200).json({
            data:newInsuranceDetail,
            "success":true,
            "message":"Insurance details updated successfully"
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Failed to create insurance details",
            success:false
        });
    }
};

export const generatePdf = async(req, res)=>{
    try{
        const {id} = req.params;
        var insuranceDetails = await InsuranceDetails.findOne({
            include: [
                {  model: InsuranceProvider,  as: 'InsuranceProvider',  required: true },
                { model: InsuranceReceipient , 
                    as: 'InsuranceReceipient', 
                    required: true,
                    include: [
                        {
                            model: DoctorDetails,
                            as: 'Doctor', 
                            attributes: ["doctor_name", "doctor_phone_no"], 
                            required: false
                        }
                    ]

                }
            ],
            attributes: {
                include: [ 
                [sequelize.fn('DATE_FORMAT',sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'], 
                [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date']
            ]},
            where:{ ID:id }
        });

        insuranceDetails = await insuranceDetails?.toJSON(); 
        console.log(insuranceDetails, "generate PDF");

        if(insuranceDetails){
            const dateNow = Date.now();
            const pdfName = `${insuranceDetails.InsuranceReceipient.name}-${insuranceDetails.InsuranceReceipient.recipient_ma}-${dateNow}.pdf`
             const pdf =  await generatePDF(pdfName,insuranceDetails);
            if(pdf){
                if(insuranceDetails.pdf_location && insuranceDetails.pdf_location?.length){
                    await deleteFile(insuranceDetails.pdf_location);
                }
                
                await InsuranceDetails.update(
                    { pdf_location: pdf },
                    {
                        where: {
                            ID:id
                        },
                    }
                );
            };
            return res.status(200).json({"message":"PDF generated successfully", success:true, pdfLocation : pdf});

        }else{
            return res.status(404).json({
                message: "Insurance details not found",
                success:false
            });  
        }
    }catch(e){
        console.log(e);
        return res.status(500).json({
            message: "Failed to generate pdf",
            success:false
        });  
    }
}

export const downloadPDF =  async(req, res)=>{
    try{
        const {id} = req.params;

        let insuranceDetails = await InsuranceDetails.findOne({
            include: [
                {  model: InsuranceProvider,  as: 'InsuranceProvider',  required: true },
                { model: InsuranceReceipient , 
                    as: 'InsuranceReceipient', 
                    required: true,
                    include: [
                        {
                            model: DoctorDetails,  // Add the Doctor model here
                            as: 'Doctor',   // Use the appropriate alias as defined in your associations
                            attributes: ["doctor_name", "doctor_phone_no"], // Add whatever doctor attributes you need
                            required: false // Change to true if you want inner join
                        }
                    ]

                }
            ],
            attributes: {
                include: [ 
                [sequelize.fn('DATE_FORMAT',sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'], 
                [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date']
            ]
            },
            where:{
                ID:id
            }
        });

        insuranceDetails = await insuranceDetails.toJSON(); 

        insuranceDetails['doctor_name'] = insuranceDetails['InsuranceReceipient.Doctor.doctor_name'];
        insuranceDetails['doctor_number'] = insuranceDetails['InsuranceReceipient.Doctor.doctor_phone_no'];

        console.log(insuranceDetails, "download PDF");

        let URL = ""
        if(insuranceDetails){
         
            if(insuranceDetails?.pdf_location){
                URL =  insuranceDetails?.pdf_location;
            }else{
                const dateNow = Date.now();
                const pdfName = `${insuranceDetails.InsuranceReceipient.name}-${insuranceDetails.InsuranceReceipient.recipient_ma}-${dateNow}.pdf`
                const pdf =  await generatePDF(pdfName,insuranceDetails);
                if(pdf){
                    await InsuranceDetails.update(
                        { pdf_location: pdf },
                        {
                            where: {
                                ID:id
                            },
                        }
                    );
                }

                URL = pdf
            }

            const downloaadUrl = (process.env.BACKEND_URL +"/"+ URL);

            return res.status(200).json({
                message: "PDF link found",
                data : downloaadUrl,
                success:true
            }); 

        }else{
            return res.status(404).json({
                message: "Insurance details not found",
                success:false
            });  
        }



    }catch(error){
        console.log(error);
        return res.status(500).json({
            message: "Failed to download pdf",
            success:false
        });  
    }
}


export const getRenewalData = async (req, res) => {
    try {
      const {
        fromDate,
        toDate,
        sortBy = "created_at",
        sortOrder = "DESC",
        page = 1,
        limit = 10,
      } = req.query;
  
      // Date filtering
      const dateFilter = {};
      if (fromDate) dateFilter[Op.gte] = new Date(fromDate);
      if (toDate) dateFilter[Op.lte] = new Date(toDate);
  
      // Pagination setup
      const offset = (page - 1) * limit;
  
      // Fetch data with filters, sorting, pagination, and user join
      const insuranceRenewalData = await EmailStatus.findAll({
        where: {
          ...(fromDate || toDate ? { created_at: dateFilter } : {}),
        },
        include: [
          {
            model: User,
            as: 'User',  
            required: true 
          },
        ],
        attributes: {
            include: [
                [sequelize.literal("CONCAT(User.f_name, ' ', User.l_name)"), 'name']
            ]
        },
        order: [[sortBy, sortOrder.toUpperCase()]], // Sorting
        limit: parseInt(limit), // Number of records per page
        offset: parseInt(offset), // Offset for pagination
        raw: true,
      });
  
      // Count total records for pagination
      const totalRecords = await EmailStatus.count({
        where: {
          ...(fromDate || toDate ? { created_at: dateFilter } : {}),
        },
      });
  
      // Total pages calculation
      const totalPages = Math.ceil(totalRecords / limit);
  
      return res.status(200).json({
        success: true,
        data: insuranceRenewalData,
        pagination: {
          totalRecords,
          totalPages,
          currentPage: parseInt(page),
          recordsPerPage: parseInt(limit),
        },
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        message: "Failed to fetch data",
        success: false,
      });
    }
  };


  export const getRenewedInsuranceDetails = async(req, res)=>{
    try{

        const { id } = req.params;

        if(id){
            const insuranceRenewalData = await EmailStatus.findOne({
                where:{
                    ID:id
                }
            })

            if(insuranceRenewalData){

                const ids = JSON.parse(insuranceRenewalData.insurance_ids);

                if(insuranceRenewalData?.insurance_ids){
                    const ids = JSON.parse(insuranceRenewalData.insurance_ids);
                    const { rows: insuranceDetails, count: totalRecords } = await InsuranceDetails.findAndCountAll({
                        include: [
                          {
                            model: InsuranceProvider,
                            as: 'InsuranceProvider',
                            attributes: ['provider_name'],
                            required: true,
                          },
                          {
                            model: InsuranceReceipient,
                            as: 'InsuranceReceipient',
                            required: true,
                          },
                        ],
                        attributes: {
                          include: [
                            [sequelize.col('InsuranceProvider.provider_name'), 'provider_name'],
                            [sequelize.col('InsuranceReceipient.name'), 'recipient_name'],
                            [sequelize.col('InsuranceReceipient.recipient_ma'), 'recipient_ma'],
                            [sequelize.fn('DATE_FORMAT', sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'],
                            [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date'],
                          ],
                        },
                        where: {
                          // Assuming `idList` is an array of IDs you want to filter by
                          id: {
                            [Op.in]: ids, // Use Op.in for the IN clause
                          },
                        },
                        raw: true,
                      });

                      return res.status(200).json({
                        message: "",
                        success: true,
                        data:insuranceDetails
                      });

                }else{
                    return res.status(404).json({
                        message: "No insurance renewed on the selected day",
                        success: false,
                      });   
                }
            }else{
                return res.status(404).json({
                    message: "Failed to fetch data",
                    success: false,
                  });   
            }
        }else{
            return res.status(404).json({
                message: "Failed to fetch data",
                success: false,
              });   
        }

    }catch(e){
        console.log(e);
        return res.status(500).json({
            message: "Failed to fetch data",
            success: false,
          }); 
    }
  }



/******
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */

export const addInsuranceProvider = async(req, res, next)=>{
    try {
        // Destructure form data from req.body
        const { provider_name, phone_no_1, phone_no_2, is_default, provider_code, provider_email  } = req.body;

        // Check if file was uploaded
        const logoLocation = req.file ? `/uploads/${req.file.filename}` : null;
        const path2 = logoLocation?.replace(/\\/g, "/") || "";


        if(is_default && is_default.toLowerCase() === "true"){
             // default value set
             await InsuranceProvider.update(
                { is_default: false },
                { where: {} }
            );
        }

        const results = await InsuranceProvider.findAll({
            where: {
                [Op.or]: [
                    { provider_name: { [Op.like]: `%${provider_name}%` } },
                    { provider_code: { [Op.like]: `%${provider_code}%` } },
                    { provider_email: { [Op.like]: `%${provider_email}%` } }
                ]
            },
            raw:true
        });

        

        if(results.length){
            return res.status(400).json({ 
                message: 'Another Provider with same details already exist, Please check the Name, Provider Code, Provider Email.', 
                success:false 
            });
        }


        // Save data to the database
        const newProvider = await InsuranceProvider.create({
            provider_name,
            phone_no_1,
            phone_no_2,
            logo_location: path2,
            is_default,
            provider_code,
            provider_email
        });

        // Respond with success message
        return res.status(201).json({ message: 'Insurance Provider added successfully', data: newProvider });
    } catch (error) {
        console.log(error);
      return res.status(500).json({ message: 'Error adding provider', error: error.message });
    }  
}


export const insuranceProvider = async (req, res) => {
    try {
        const { is_default, search, sortBy = 'date_created', sortOrder = 'DESC', page = 1, pageSize = 10 } = req.query;
        console.log(sortBy);
        const whereData = {};
        if (is_default) {
            whereData.is_default = Boolean(is_default) == true ? 1:0;
        }

        if (search) {
            whereData[Op.or] = [
                { provider_name: { [Op.like]: `%${search}%` } },
                { provider_code: { [Op.like]: `%${search}%` } },
                { provider_email: { [Op.like]: `%${search}%` } },
                { phone_no_1: { [Op.like]: `%${search}%` } },
                { phone_no_2: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (Number(page) - 1) * Number(pageSize);
        const limit = Number(pageSize);

        const { count, rows } = await InsuranceProvider.findAndCountAll({
            where: whereData,
            attributes: [
                "ID",
                "provider_name",
                "provider_code",
                "phone_no_1",
                "phone_no_2",
                "logo_location",
                "is_deleted",
                "is_default",
                "provider_email",
                [fn('DATE', col('date_created')), 'date_created']
            ],
            order: [[sortBy, sortOrder]],
            offset,
            limit
        });

        const totalPages = Math.ceil(count / limit);
        const currentPage = Number(page);

        if (rows.length > 0) {
            return res.status(200).json({
                message: 'Insurance Provider fetched successfully',
                data: rows,
                pagination: {
                    currentPage,
                    totalPages,
                    totalItems: count,
                    pageSize: limit
                },
                success: true
            });
        } else {
            return res.status(204).json({
                message: 'No insurance providers found',
                data: [],
                pagination: {
                    currentPage,
                    totalPages,
                    totalItems: count,
                    pageSize: limit
                },
                success: false
            });
        }
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching provider',
            error: error.message,
            success: false
        });
    }
};


export const deleteInsurance = async (req, res) => {
    try {
        const { id } = req.params;
        const insurance = await InsuranceDetails.findOne({
            where: { ID: id }
        });

        if(insurance){
            console.log(insurance.is_active, "insurance.is_active");
            if(insurance.is_active){
                return res.status(400).json({ message: 'Cannot delete a active insurance' , success:false }); 
            }

            if(insurance?.pdf_location){
                await deleteFile(insurance.pdf_location);
            }
    
            const result = await InsuranceDetails.destroy({
                where: { ID: id }
            });
    
            if (result === 0) {
                return res.status(404).json({ message: 'Provider not found', success:false });
            }
    
            return res.status(200).json({ message: 'Provider deleted successfully' , success:true });
        }else{
            return res.status(404).json({ message: 'Insurance not found ' , success:false });
        }


    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error deleting provider', error: error.message, success:false });
    }
};


export const singleInsuranceDetails = async(req, res)=>{
    try{

        const { id } =  req.params
console.log("valled<===================", id)
        const insuranceDetails = await InsuranceDetails.findOne({
            include: [
                {
                    model: InsuranceProvider,
                    as: 'InsuranceProvider',
                    attributes: ['provider_name'],
                    required: true
                },
                { 
                    model: InsuranceReceipient, 
                    as: 'InsuranceReceipient', 
                    required: true,
                    attributes: ["name", "recipient_ma","dob"],
                    include: [
                        {
                            model: DoctorDetails,  // Add the Doctor model here
                            as: 'Doctor',   // Use the appropriate alias as defined in your associations
                            attributes: ["doctor_name", "doctor_phone_no"], // Add whatever doctor attributes you need
                            required: false // Change to true if you want inner join
                        }
                    ]
                }
            ],
            attributes: {
                include: [
                    [sequelize.literal('InsuranceProvider.provider_name'), 'provider_name'],
                    [sequelize.literal('InsuranceReceipient.name'), 'recipient_name'],
                    [sequelize.literal('InsuranceReceipient.recipient_ma'), 'recipient_ma'],
                    [sequelize.literal('InsuranceReceipient.dob'), 'dob'],
                    // [sequelize.literal('InsuranceReceipient.Doctor.doctor_name'), 'doctor_name'], // Add doctor fields
                    // [sequelize.literal('InsuranceReceipient.Doctor.doctor_phone_no'), 'doctor_phone_no'],
                    [sequelize.fn('DATE_FORMAT', sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'],
                    [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date']
                ]
            },
            where: {
                ID: id
            },
            raw: true
        });


        if (insuranceDetails && 'InsuranceReceipient.Doctor.doctor_name' in insuranceDetails) {
            insuranceDetails['doctor_name'] = insuranceDetails['InsuranceReceipient.Doctor.doctor_name'];
        } else {
            insuranceDetails['doctor_name'] = "";
        }
        
        if (insuranceDetails && 'InsuranceReceipient.Doctor.doctor_phone_no' in insuranceDetails) {
            insuranceDetails['doctor_number'] = insuranceDetails['InsuranceReceipient.Doctor.doctor_phone_no'];
        } else {
            insuranceDetails['doctor_number'] = "";
        }

        if(Object.keys(insuranceDetails).length){
           return res.status(200).json({ message: 'Insurance Details added successfully', data: insuranceDetails, success:true });
        }else{
            return res.status(204).json({ message: 'Insurance Details added successfully', data: [], success:false });
        }

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'Error fetching provider', error: error.message , success:false});
    }
}

export const renewInsurance = async(req, res)=>{
    try{

        const {type, id} = req.params;
        const insurance = await InsuranceDetails.findOne({
            where:{
                ID:id
            },
            raw:true
        })  

        switch(type){
            case "simple":
                 
                    if(insurance){
                        const { from_service_date, plan_of_care, to_service_date, send_email = 0 } = req.body;
                        console.log( req.body, " req.body")
                        // Check for overlapping dates or future end date > 20 days
                        const existingInsurance = await InsuranceDetails.findAll({
                            where: {
                                recipient_id: insurance.recipient_id,
                                is_active: 0,
                                [Op.or]: [
                                    // Check for date overlap
                                    {
                                        from_service_date: {
                                            [Op.lte]: to_service_date // Existing start date <= New end date
                                        },
                                        to_service_date: {
                                            [Op.gte]: from_service_date // Existing end date >= New start date
                                        }
                                    },
                                    // Check if existing to_service_date is > 20 days in future
                                    literal('to_service_date > DATE_ADD(NOW(), INTERVAL 10 DAY)')
                                ]
                            },
                            raw:true
                        });

                        // console.log(existingInsurance, "existingInsurance");
                        if (existingInsurance.length > 0) {
                            return res.status(409).json({
                                message: 'Cannot update as the insurance is still active and existing end date is more than 20 days in the future',
                                success: false
                            });
                        }

                        console.log(existingInsurance, "existingInsurance")

                        // await InsuranceDetails.update(
                        //     { is_active: 0 },
                        //     { where: { recipient_id: insurance.recipient_id } }
                        // );

                        delete insurance.ID;
                        delete insurance.created_date

                        const newInsurance = await InsuranceDetails.create({
                            ...insurance,
                            from_service_date: from_service_date,
                            plan_of_care: plan_of_care,
                            to_service_date: to_service_date,
                            pdf_location:"",
                            is_active : 1
                        });

                        const newInsuranceId = newInsurance.ID;
                        if(send_email && newInsuranceId){

                            console.log("<============================================>")

                            //generate PDF and send email to provider 
                            const insuranceProvider = await InsuranceProvider.findOne({
                                where:{
                                    is_default : 1
                                },
                                raw:true
                            });

                            console.log(newInsuranceId);

                            let insuranceDetails = await InsuranceDetails.findOne({
                                include: [
                                    {
                                        model: InsuranceProvider,
                                        as: 'InsuranceProvider',
                                        attributes: ['provider_name'],
                                        required: true
                                    },
                                    { 
                                        model: InsuranceReceipient, 
                                        as: 'InsuranceReceipient', 
                                        required: true,
                                        // attributes: ["name", "recipient_ma","dob"],
                                        include: [
                                            {
                                                model: DoctorDetails,  // Add the Doctor model here
                                                as: 'Doctor',   // Use the appropriate alias as defined in your associations
                                                //attributes: ["doctor_name", "doctor_phone_no"], // Add whatever doctor attributes you need
                                                required: false // Change to true if you want inner join
                                            }
                                        ]
                                    }
                                ],
                                attributes: {
                                    include: [ 
                                        [sequelize.fn('DATE_FORMAT', sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'], 
                                        [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date']
                                    ]
                                },
                                //raw :true,
                                where: { ID: newInsuranceId }
                            });

                            insuranceDetails = await insuranceDetails?.toJSON(); 
                            if(insuranceDetails){
                                console.log(">>========================================")
                                const dateNow = Date.now();
                                const pdfName = `${insuranceDetails.InsuranceReceipient.name}-${insuranceDetails.InsuranceReceipient.recipient_ma}-${dateNow}.pdf`
                                const pdf =  await generatePDF(pdfName,insuranceDetails);
                                if(pdf){
                                    console.log(pdf, "pdf")
                                    if(insuranceDetails.pdf_location && insuranceDetails.pdf_location?.length){
                                        await deleteFile(insuranceDetails.pdf_location);
                                    }
                                    await InsuranceDetails.update(
                                        { pdf_location: pdf },
                                        {
                                            where: {
                                                ID:newInsuranceId
                                            },
                                        }
                                    );

                                    const emailBody = createEmailBody("notifyInsuranceProvider", {});
                                    const emailOptions = {
                                        html: emailBody,
                                        attachments: [
                                          {
                                            filename: path.basename(pdf),
                                            path: pdf
                                          }
                                        ]
                                      };
                                    const settings = await Settings.findAll({
                                        raw:true
                                    });

                                    console.log(settings, "settings");

                                    for(const setting of settings){
                                       if(setting["key"] == "email_sender") emailOptions["to"] = setting["value"];
                                       if(setting["key"] == "email_subject") emailOptions["subject"] = setting["value"];
                                    }


                                    // Define email options

                                    console.log(emailOptions, "emailOptions")
                                    // Send the email
                                    const response = await sendMailgunEmail(emailOptions);
                                    console.log(response)
                                    return res.status(200).json({ message: 'Insurance renewed successfully for the customer and email has been sent', success:true}); 
                                };
                            }
                        }
                        return res.status(200).json({ message: 'Insurance renewed successfully for the customer', success:true}); 
                    }else{
                        return res.status(404).json({ message: 'Cannot find the insurance', success:false});
                    }
                break;
            case "complex":
                    const {
                        provider_id,
                        recipient_id,
                        prsrb_prov,
                        pa,
                        from_service_date,
                        to_service_date,
                        recipient_is,
                        procedure_code,
                        units,
                        plan_of_care,
                        number_of_days,
                        max_per_day,
                        max_per_day_unit,
                        global_hours_per_week,
                        insurance_status,
                        mmis_entry,
                        rsn,
                        comment_pa,
                        procedure_units,
                    } = req.body;

                    await InsuranceDetails.update(
                        { is_active: 0 },
                        { where: { recipient_id: insurance.recipient_id } }
                    );

                    const newInsuranceDetail = await InsuranceDetails.create({
                                provider_id,
                                recipient_id,
                                prsrb_prov,
                                pa,
                                global_hours_per_week,
                                from_service_date,
                                to_service_date,
                                recipient_is,
                                procedure_code,
                                units:procedure_units,
                                plan_of_care,
                                number_of_days,
                                max_per_day,
                                max_per_day_unit,
                                insurance_status,
                                mmis_entry,
                                rsn,
                                comment_pa,
                                is_active: 0
                            });
                        
                    return res.status(201).json({
                        data:newInsuranceDetail, 
                        success:true, 
                        "message":"Insurance renewed successfully"
                    });

                break;
            default:
                return res.status(400).json({ message: 'Error fetching provider', success:false});
        }

    }catch(error){
        console.log(error);
        return res.status(500).json({ message: 'Error fetching provider', error: error.message, success:false });
    }
}

export const updateStatusInDB = async(req, res)=>{
    try{
        const { ids } = req.body;
        const {user, combinedPdfPath, emailResp} = req;
        const {userId } = user;

        console.log("this called");
        console.log(ids);
        const recipientIds = await InsuranceDetails.findAll({
            where: {
                ID: { [Op.in]: ids }  // Ensure ids is an array of valid IDs
            },
            attributes: ["recipient_id"], // Fetch only the "recipient_id" field
            raw:true
        });

        const rec_ids = recipientIds.map(rec=>rec.recipient_id);
        
        await InsuranceDetails.update(
            { is_active:0 },{
                where: {
                    ID: { [Op.in]: rec_ids } 
                },
            }
        );

        await InsuranceDetails.update(
            { is_email_sent: 1, is_active:1 },
            {
                where: {
                    ID: { [Op.in]: ids } 
                },
            }
        );

        const pathsplit = combinedPdfPath.split("assets");
        const modifiedPath = "/assets" + pathsplit[1].replace(/\\/g, "/");

        await EmailStatus.create({
            combined_pdf_location: modifiedPath,	
            renewal_count: ids.length,
            insurance_ids : JSON.stringify(ids),	
            user_initiated:	userId,
            email_status : "success",	
            email_response:	JSON.stringify(emailResp)
        })

        return res.status(200).json({
            message:"Email sent successfully",
            success:true
        })
    } catch(error){
         console.log(error);
        return res.status(500).json({ message: 'Error occured while trying to save email related details',success:false });
    }  
} 



/******
 * ========================================================================================================
 * 
 * ========================================================================================================
 */

export const singleInsuranceProvider = async(req, res)=>{
    try{

        const { id } =  req.params
    
        const insuranceProvider = await InsuranceProvider.findOne({
            where:{
                ID:id
            }
        });

        if(Object.keys(insuranceProvider).length){
           return res.status(200).json({ message: 'Insurance Provider added successfully', data: insuranceProvider, success:true });
        }else{
            return res.status(204).json({ message: 'Insurance Provider added successfully', data: [], success:false});
        }

    }catch(error){
        res.status(500).json({ message: 'Error fetching provider', error: error.message });
    }
}



export const updateProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const  is_default  = updateData.is_default.toLowerCase() === "true"
       

        if (req.file) {
            const logoLocation = req.file ? `/uploads/${req.file.filename}` : null;
            const path2 = logoLocation.replace(/\\/g, "/");
            updateData.logo_location = path2;
        }
        // Validate ID
        if (!id) {
            return res.status(400).json({ message: "Provider ID is required", success:false });
        }

        if(is_default){
            // default value set
            await InsuranceProvider.update(
               { is_default: false },
               { where: {} }
           );
           
       }

        const results = await InsuranceProvider.findAll({
                    where: {
                        [Op.or]: [
                            { provider_name: { [Op.like]: `%${updateData.provider_name}%` } },
                            { provider_code: { [Op.like]: `%${updateData.provider_code}%` } },
                            { provider_email: { [Op.like]: `%${updateData.provider_email}%` } }
                        ]
                    },
                    raw:true
                });


        if(results){
            const ids = results.filter( res=> res.ID != id);
            if(ids.length){
                return res.status(400).json({ 
                    message: 'Another Provider with same details already exist, Please check the Name, Provider Code, Provider Email.', 
                    success:false 
                });
            }
        }

        // Update the provider in the database
        const [updated] = await InsuranceProvider.update({...updateData, is_default}, {
            where: { ID: id }
        });

        // Check if the update was successful
        if (updated) {
            const updatedProvider = await InsuranceProvider.findOne({ where: { ID: id } });
            return res.status(200).json({
                message: "Provider updated successfully",
                data: updatedProvider, 
                success:true
                
            });
        } else {
            return res.status(404).json({ message: "No changes found in data", success:false });
        }

    } catch (error) {
        console.error("Error updating provider:", error.message);
        res.status(500).json({
            message: "Error updating provider",
            error: error.message, 
            success:false
        });
    }
};

export const deleteProvider = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await InsuranceProvider.destroy({
            where: { ID: id }
        });

        if (result === 0) {
            return res.status(404).json({ message: 'Provider not found', success:false });
        }

        res.status(200).json({ message: 'Provider deleted successfully', success:true });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting provider', error: error.message, success:false });
    }
};

