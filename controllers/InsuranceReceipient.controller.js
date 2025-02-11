import { logActivity } from "../utils/logger.js";
import sequelize, { Op, fn, col } from "sequelize";
import InsuranceReceipient from "../models/InsuranceReceipient.model.js";
import InsuranceDetails from "../models/insuranceDetails.model.js";

// Get all insurance recipients
export const getInsuranceReceipient = async (req, res) => {
    try {
        const {
            search_term = "",
            recipient_ma = "",
            from_date = "",
            to_date = "",
            dateCreated = "",
            sort_by = "name",
            sort_order = "asc",
            records_per_page = 10,
            page = 1
        } = req.query;

        let whereConditions = { is_deleted: false };

        if (search_term) {
            whereConditions.name = { [Op.like]: `%${search_term}%` };
        }

        if (recipient_ma) {
            whereConditions.recipient_ma = { [Op.like]: `%${recipient_ma}%` };
        }

        if (dateCreated) {
            whereConditions.date_created = { [Op.eq]: dateCreated };
        }

        const limit = records_per_page === "all" ? null : parseInt(records_per_page);
        const offset = limit ? (parseInt(page) - 1) * limit : null;

        let insuranceWhereConditions = { is_active: true };
        let required = false;

        if (from_date || to_date) {
            insuranceWhereConditions.created_date = {};
            if (from_date) insuranceWhereConditions.created_date[Op.gte] = from_date;
            if (to_date) insuranceWhereConditions.created_date[Op.lte] = to_date;
            required = true;
        }

        const totalRecords = await InsuranceReceipient.count({
            where: whereConditions,
            include: required ? [{ model: InsuranceDetails, as: "InsuranceDetails", required: true, where: insuranceWhereConditions }] : []
        });

        const recipients = await InsuranceReceipient.findAll({
            where: whereConditions,
            attributes: [
                "ID",
                "name",
                "recipient_ma",
                "is_deleted",
                "doctor_id",
                "prsrb_prov",
                "recipient_type",
                "dob",
                [fn("DATE", col("date_created")), "date_created"],
            ],
            include: [
                {
                    model: InsuranceDetails,
                    as: "InsuranceDetails",
                    required: required,
                    separate: true,
                    order: [["created_date", "DESC"]],
                    limit: 1,
                }
            ],
            order: [[sort_by, sort_order]],
            limit,
            offset,
            nest: true,
        });

        await logActivity(req.user?.userId || null, "Viewed Insurance Recipients", "Insurance", null, null, req.query, req.ip, req.headers["user-agent"]);

        return res.status(200).json({
            data: recipients,
            message: "Data fetched successfully",
            success: true,
            pagination: { totalRecords, totalPages: limit ? Math.ceil(totalRecords / limit) : 1, currentPage: parseInt(page), records_per_page: limit || totalRecords }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error occurred while fetching data", success: false });
    }
};

// Get single insurance recipient
export const getSingleInsuranceRecipient = async (req, res) => {
    const { id } = req.params;
    const { get_insurance_details } = req.query;
    let include = [];
    let order = [];

    if (get_insurance_details !== undefined) {
        include = [{ model: InsuranceDetails, as: "InsuranceDetails", required: false }];
        order = [[{ model: InsuranceDetails }, "is_active", "DESC"]];
    }

    try {
        const recipient = await InsuranceReceipient.findOne({ where: { id, is_deleted: false }, include, order });

        if (!recipient) return res.status(404).json({ message: "Recipient not found" });

        await logActivity(req.user?.userId || null, "Viewed Insurance Recipient", "Insurance", id, null, req.query, req.ip, req.headers["user-agent"]);

        return res.status(200).json({ data: recipient, message: "Data fetched successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error fetching details" });
    }
};

// Create insurance recipient
export const createInsuranceRecipient = async (req, res) => {
    const { name, recipient_ma, doctor_id, prsrb_prov, recipient_type, dob } = req.body;

    if (!name || !recipient_ma || !doctor_id || !prsrb_prov || !recipient_type || !dob) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const newRecipient = await InsuranceReceipient.create({ name, recipient_ma, doctor_id, prsrb_prov, recipient_type, dob });

        await logActivity(req.user?.userId || null, "Created New Insurance Recipient", "Insurance", newRecipient.ID, null, req.body, req.ip, req.headers["user-agent"]);

        return res.status(201).json({ data: newRecipient, message: "Recipient added successfully" });
    } catch (error) {
        console.error("Error creating recipient:", error);
        return res.status(500).json({ message: "Error occurred while creating recipient" });
    }
};

// Update insurance recipient
export const updateInsuranceReceipient = async (req, res) => {
    const { id } = req.params;
    const { name, recipient_ma, doctor_id, prsrb_prov, recipient_type, dob } = req.body;

    try {
        const recipient = await InsuranceReceipient.findOne({ where: { ID: id, is_deleted: false } });

        if (!recipient) return res.status(404).json({ message: "Recipient not found" });

        const previousData = recipient.toJSON();

        await recipient.update({ name, recipient_ma, doctor_id, prsrb_prov, recipient_type, dob });

        await logActivity(req.user?.userId || null, "Updated Insurance Recipient", "Insurance", id, previousData, req.body, req.ip, req.headers["user-agent"]);

        return res.status(200).json({ data: recipient, message: "Recipient updated" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error updating recipient" });
    }
};

// Soft delete insurance recipient
export const deleteInsuranceReceipient = async (req, res) => {
    const { id } = req.params;

    try {
        const recipient = await InsuranceReceipient.findOne({ where: { ID: id } });

        if (!recipient) return res.status(404).json({ message: "Recipient not found" });

        await recipient.update({ is_deleted: true });

        await logActivity(req.user?.userId || null, "Deleted Insurance Recipient", "Insurance", id, recipient.toJSON(), { is_deleted: true }, req.ip, req.headers["user-agent"]);

        return res.status(200).json({ message: "Recipient deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error deleting recipient" });
    }
};
