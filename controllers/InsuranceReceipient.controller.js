import InsuranceReceipient from "../models/InsuranceReceipient.model.js"
import InsuranceDetails from "../models/insuranceDetails.model.js";
import sequelize,{Op, fn, col} from "sequelize";
// Get all insurance recipients
export const getInsuranceReceipient = async (req, res) => {
    try {
        // Destructure and set default values for query parameters
        const {
            search_term = "",
            recipient_ma = "",
            dateCreated = "",
            sort_by = "name",
            sort_order = "asc",
            records_per_page = 10,
            page = 1
        } = req.query;

        // Initialize where conditions, only fetching non-deleted records
        let whereConditions = { is_deleted: false };

        // Apply search filters for recipient name and recipient MA if provided
        if (search_term) {
            whereConditions = {
                ...whereConditions,
                name: { [Op.like]: `%${search_term}%` }
            };
        }

        if (recipient_ma) {
            whereConditions = {
                ...whereConditions,
                receipient_ma: { [Op.like]: `%${recipient_ma}%` }
            };
        }

        // Filter by exact match on date_created if provided
        if (dateCreated) {
            whereConditions = {
                ...whereConditions,
                date_created: { [Op.eq]: dateCreated }
            };
        }

        // Handle pagination parameters
        const limit = records_per_page === "all" ? null : parseInt(records_per_page);
        const offset = limit ? (parseInt(page) - 1) * limit : null;

        // Get the total number of records matching the filters
        const totalRecords = await InsuranceReceipient.count({ where: whereConditions });

        // Fetch the filtered and sorted records
        const recipients = await InsuranceReceipient.findAll({
            where: whereConditions,
            attributes: [
                "ID",
                "name",
                "receipient_ma",
                "is_deleted",
                [fn('DATE', col('date_created')), 'date_created'], // Cast date_created to date only
            ],
            order: [[sort_by, sort_order]],
            limit: limit,
            offset: offset,
        });

        // Calculate the total number of pages
        const totalPages = limit ? Math.ceil(totalRecords / limit) : 1;

        // Respond with data and pagination details
        return res.status(200).json({
            data: recipients,
            message: "Data fetched successfully",
            success: true,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: parseInt(page),
                records_per_page: limit || totalRecords,
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Error occurred while trying to get the details",
            success: false
        });
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
