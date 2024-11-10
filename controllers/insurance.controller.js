import InsuranceDetails from "../models/insuranceDetails.model.js";
import InsuranceProvider from "../models/InsuranceProvider.model.js";
import DoctorDetails from "../models/doctors.model.js";
import sequelize from "sequelize";
import { raw } from "mysql2";

export const getInsuranceDetails = async (req, res) => {
    try {

        const {
            is_default
        } = req.query;
        let whereData = {}

        if(is_default){
            whereData = {
                where :{
                    is_default : is_default 
                }
            }
        }
        const currentDate = new Date();

        const insuranceDetails = await InsuranceDetails.findAll({
            include: [
                {
                    model: InsuranceProvider,
                    as: 'InsuranceProvider',
                    attributes: ['provider_name'],
                    required: true
                },
                {
                    model: DoctorDetails,
                    as: 'DoctorDetail',
                    attributes: ['doctor_name',"doctor_phone_no"],
                    required: true,
                
                }
            ],
            attributes: {
                include: [
                    [sequelize.col('InsuranceProvider.provider_name'), 'provider_name'],
                    [sequelize.fn('DATE_FORMAT', sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'],
                    [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date']
                ]
            },
            order: [
                [
                    sequelize.literal(
                        `ABS(DATEDIFF(to_service_date, '${currentDate.toISOString().split('T')[0]}'))`
                    ),
                    'ASC'
                ]
            ],
            ...whereData,
            raw: true
        });

        console.log(insuranceDetails);
        
        return res.status(200).json({data:insuranceDetails,"message":"data fetched successfully"});
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Failed to get insurance details",
        });
    }
};


export const createInsuranceDetails = async (req, res) => {
    try {
        const {
            provider_id,
            recipient_id,
            doctor_id,
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
            insurance_status,
            mmis_entry,
            rsn,
            comment_pa,
            procedure_val,
        } = req.body;

        // Check for existing insurance details for this recipient with overlapping dates
        const existingDetails = await InsuranceDetails.findOne({
            where: {
                recipient_id,
                to_service_date: {
                    [sequelize.Op.gte]: from_service_date // to_service_date is greater than or equal to new from_service_date
                },
                from_service_date: {
                    [sequelize.Op.lte]: to_service_date // from_service_date is less than or equal to new to_service_date
                },
                is_active: true // Only check for active contracts
            }
        });





        // If an existing entry is found, update it
        if (existingDetails) {
            // Update the old entry to set is_current_active to 0
            await InsuranceDetails.update(
                { is_active: false }, // Set the old entry to inactive
                { where: { ID: existingDetails.ID } }
            );
        }
    
        // Create a new insurance detail entry
        const newInsuranceDetail = await InsuranceDetails.create({
            provider_id,
            recipient_id,
            doctor_id,
            prsrb_prov,
            pa,
            from_service_date,
            to_service_date,
            recipient_is,
            procedure_code,
            units:procedure_val,
            plan_of_care,
            number_of_days,
            max_per_day,
            max_per_day_unit,
            insurance_status,
            mmis_entry,
            rsn,
            comment_pa,
            is_active: true
        });

        return res.status(201).json({data:newInsuranceDetail, success:true, "message":"New insurance created successfully"});
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Failed to create insurance details",
        });
    }
};



export const updateInsuranceDetails = async (req, res) => {
    try {
        const {
            provider_id,
            recipient_id,
            doctor_id,
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
            insurance_status,
            mmis_entry,
            rsn,
            comment_pa,
            procedure_val
        } = req.body;


        const {id} = req.params; 

        // Check for existing insurance details for this recipient with overlapping dates
        const existingDetails = await InsuranceDetails.findOne({
            where: {
                recipient_ma,
                to_service_date: {
                    [sequelize.Op.gte]: from_service_date // to_service_date is greater than or equal to new from_service_date
                },
                from_service_date: {
                    [sequelize.Op.lte]: to_service_date // from_service_date is less than or equal to new to_service_date
                },
                is_active: true // Only check for active contracts
            }
        });

        // If an existing entry is found, update it
        if (existingDetails) {
            // Update the old entry to set is_current_active to 0
            await InsuranceDetails.update(
                { is_active: false }, // Set the old entry to inactive
                { where: { ID: existingDetails.ID } }
            );
        }

        console.log("doctor id ", doctor_id);

        // Create a new insurance detail entry
        const newInsuranceDetail = await InsuranceDetails.update({
            provider_id,
            recipient_id,
            doctor_id,
            prsrb_prov,
            pa,
            from_service_date,
            to_service_date,
            recipient_is,
            procedure_code,
            units:procedure_val,
            plan_of_care,
            number_of_days,
            max_per_day,
            max_per_day_unit,
            insurance_status,
            mmis_entry,
            rsn,
            comment_pa
        },{
            where: { ID: id }
        });

        return res.status(200).json({data:newInsuranceDetail,"success":true,"message":"Insurance details updated successfully"});
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Failed to create insurance details",
        });
    }
};




export const addInsuranceProvider = async(req, res, next)=>{
    try {
        // Destructure form data from req.body
        const { provider_name, phone_no_1, phone_no_2, is_default, provider_code  } = req.body;

        // Check if file was uploaded
        const logoLocation = req.file ? `/uploads/${req.file.filename}` : null;
        const path2 = logoLocation.replace(/\\/g, "/");

        if(is_default){
             // default value set
             console.log("is default set");
             await InsuranceProvider.update(
                { is_default: false },
                { where: {} } // Empty condition updates all records
            );
            
        }

        // Save data to the database
        const newProvider = await InsuranceProvider.create({
            provider_name,
            phone_no_1,
            phone_no_2,
            logo_location: path2,
            is_default,
            provider_code
        });

        // Respond with success message
        res.status(201).json({ message: 'Insurance Provider added successfully', data: newProvider });
    } catch (error) {
        console.log("error")
        res.status(500).json({ message: 'Error adding provider', error: error.message });
    }  
}


export const insuranceProvider = async(req, res)=>{
    try{
        const {
        is_default
        } = req.query;
    
    let whereData = {}

        if(is_default){
            whereData = {
                where :{
                    is_default : is_default 
                }
            }
        }

        const insuranceProvider = await InsuranceProvider.findAll({...whereData});

        if(insuranceProvider.length>0){
           return res.status(200).json({ message: 'Insurance Provider added successfully', data: insuranceProvider });
        }else{
            return res.status(204).json({ message: 'Insurance Provider added successfully', data: [] });
        }

    }catch(error){
        res.status(500).json({ message: 'Error fetching provider', error: error.message });
    }
}


export const deleteInsurance = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await InsuranceDetails.destroy({
            where: { ID: id }
        });

        if (result === 0) {
            return res.status(404).json({ message: 'Provider not found' });
        }

        res.status(200).json({ message: 'Provider deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting provider', error: error.message });
    }
};


export const singleInsuranceDetails = async(req, res)=>{
    try{

        const { id } =  req.params
        console.log(id,"id");
    
        const insuranceProvider = await InsuranceDetails.findOne({
            include: [
                {
                    model: InsuranceProvider,
                    as: 'InsuranceProvider',
                    attributes: ['provider_name'],
                    required: true
                },
                {
                    model: DoctorDetails,
                    as: 'DoctorDetail',
                    attributes: ['doctor_name',"doctor_phone_no"],
                    required: true
                }
            ],
            attributes: {
                include: [
                    [sequelize.literal('InsuranceProvider.provider_name'), 'provider_name'],
                    [sequelize.literal('DoctorDetail.doctor_name'), 'doctor_name'],
                    [sequelize.literal('DoctorDetail.doctor_phone_no'), 'doctor_number'],
                    [sequelize.fn('DATE_FORMAT', sequelize.col('from_service_date'), '%Y-%m-%d'), 'from_service_date'],
                    [sequelize.fn('DATE_FORMAT', sequelize.col('to_service_date'), '%Y-%m-%d'), 'to_service_date']
                ]
            },
            where:{
                ID:id
            },
            raw:true
        });

        if(Object.keys(insuranceProvider).length){
           return res.status(200).json({ message: 'Insurance Details added successfully', data: insuranceProvider });
        }else{
            return res.status(204).json({ message: 'Insurance Details added successfully', data: [] });
        }

    }catch(error){
        console.log(error);
        res.status(500).json({ message: 'Error fetching provider', error: error.message });
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
        console.log(id,"id");
    
        const insuranceProvider = await InsuranceProvider.findOne({
            where:{
                ID:id
            }
        });


        console.log(insuranceProvider);

        if(Object.keys(insuranceProvider).length){
           return res.status(200).json({ message: 'Insurance Provider added successfully', data: insuranceProvider });
        }else{
            return res.status(204).json({ message: 'Insurance Provider added successfully', data: [] });
        }

    }catch(error){
        res.status(500).json({ message: 'Error fetching provider', error: error.message });
    }
}



export const updateProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (req.file) {
            const logoLocation = req.file ? `/uploads/${req.file.filename}` : null;
            const path2 = logoLocation.replace(/\\/g, "/");
            updateData.logo_location = path2;
        }
        // Validate ID
        if (!id) {
            return res.status(400).json({ message: "Provider ID is required" });
        }

        // Update the provider in the database
        const [updated] = await InsuranceProvider.update({...updateData}, {
            where: { ID: id }
        });

        // Check if the update was successful
        if (updated) {
            const updatedProvider = await InsuranceProvider.findOne({ where: { ID: id } });
            return res.status(200).json({
                message: "Provider updated successfully",
                data: updatedProvider
            });
        } else {
            return res.status(404).json({ message: "No changes found in data" });
        }

    } catch (error) {
        console.error("Error updating provider:", error.message);
        res.status(500).json({
            message: "Error updating provider",
            error: error.message
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
            return res.status(404).json({ message: 'Provider not found' });
        }

        res.status(200).json({ message: 'Provider deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting provider', error: error.message });
    }
};

