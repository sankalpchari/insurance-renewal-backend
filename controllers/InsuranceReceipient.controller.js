import InsuranceReceipient from "../models/InsuranceReceipient.model.js"
import InsuranceDetails from "../models/insuranceDetails.model.js";
import sequelize,{Op} from "sequelize";
// Get all insurance recipients
export const getInsuranceReceipient = async (req, res) => {
    try {
        const whereConditions = { is_deleted: false };
        const recipients = await InsuranceReceipient.findAll({
            where: whereConditions
        });

        return res.status(200).json({ data: recipients, message: "Data fetched successfully" });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Error occurred while trying to get the details" });
    }
};


export const getSingleInsuranceRecipient = async (req, res) => {
    const { id } = req.params; // Expecting the ID in the request parameters
    const { get_insurance_details } = req.query;
    let include = [];

    if (get_insurance_details !== undefined) {
        include = [
            {
                model: InsuranceDetails,
                as: 'InsuranceDetails',
                required: true,
            }
        ];
    }

    try {
        const recipient = await InsuranceReceipient.findOne({
            where: {
                id,
                is_deleted: false
            },
            include,       
        });

        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }

        return res.status(200).json({
            data: recipient,
            message: "Data fetched successfully"
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Error occurred while trying to get the details"
        });
    }
};

// Create a new insurance recipient
export const createInsuranceReceipient = async (req, res) => {
    const { name, receipient_ma } = req.body; // Expecting name and recipient_ma in the request body
    console.log(name, receipient_ma)
    try {
        const newRecipient = await InsuranceReceipient.create({ name, receipient_ma });
        return res.status(201).json({
            data:newRecipient,
            "message":"New insurance receipient added"
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Error occurred while trying to create the recipient" });
    }
}

// Update an existing insurance recipient
export const updateInsuranceReceipient = async (req, res) => {
    const { id } = req.params; // Expecting the ID in the request parameters
    const { name, receipient_ma } = req.body; // Expecting updated values in the request body
    try {
        const recipient = await InsuranceReceipient.findOne({
            where: { ID: id, is_deleted: false }
        });

        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }

        // Update the recipient's details
        await recipient.update({ name, receipient_ma });
        return res.status(200).json({
             data:recipient,
            "message":"Insurance receipient updated"
        });
    } catch (error) {
        return res.status(500).json({ message: "Error occurred while trying to update the recipient" });
    }
}

// Soft delete an insurance recipient
export const deleteInsuranceReceipient = async (req, res) => {
    const { id } = req.params; // Expecting the ID in the request parameters
    try {
        const recipient = await InsuranceReceipient.findOne({
            where: { ID: id }
        });

        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" });
        }

        // Soft delete the recipient
        await recipient.update({ is_deleted: true });
        return res.status(200).json({ message: "Recipient deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error occurred while trying to delete the recipient" });
    }
}
