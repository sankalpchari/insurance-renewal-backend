import DoctorDetails from "../models/doctors.model.js";
import sequelize from "sequelize";
import { logActivity } from "../utils/logger.js";

const getDoctors = async (req, res, next) => {
    try {
        const {
            search = '',
            sortField = 'doctor_name',
            sortOrder = 'asc',
            limit = 10,
            page = 1
        } = req.query;

        const options = {
            where: {
                is_deleted: 0,
                ...(search && {
                    [sequelize.Op.or]: [
                        { doctor_name: { [sequelize.Op.like]: `%${search}%` } },
                        { doctor_phone_no: { [sequelize.Op.like]: `%${search}%` } }
                    ]
                })
            },
            order: [[sortField, sortOrder]],
            limit: limit !== 'all' ? parseInt(limit) : undefined,
            offset: limit !== 'all' ? (parseInt(page) - 1) * parseInt(limit) : undefined
        };

        const { rows: doctors, count: totalRecords } = await DoctorDetails.findAndCountAll(options);
        const recordsPerPage = limit !== 'all' ? parseInt(limit) : totalRecords;
        const totalPages = limit !== 'all' ? Math.ceil(totalRecords / recordsPerPage) : 1;
        const currentPage = limit !== 'all' ? parseInt(page) : 1;

        // Log retrieval of doctor list
        await logActivity(
            req.user?.userId || null,
            "Retrieved Doctor List",
            "Doctor",
            null,
            null,
            { search, totalRecords },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(200).json({
            message: "Doctors retrieved successfully",
            success: true,
            data: doctors,
            pagination: {
                totalRecords,
                totalPages,
                recordsPerPage,
                currentPage
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Failed to get the doctors",
            success: false
        });
    }
};

const createDoctors = async (req, res, next) => {
    try {
        const { doctor_name, doctor_phone_no } = req.body;

        if (!doctor_name || !doctor_phone_no) {
            return res.status(400).json({
                message: "doctor_name and doctor_phone_no are required",
                success: false
            });
        }

        const newDoctor = await DoctorDetails.create({
            doctor_name,
            doctor_phone_no,
            is_deleted: false,
            date_created: new Date()
        });

        // Log doctor creation
        await logActivity(
            req.user?.userId || null,
            "Created New Doctor",
            "Doctor",
            newDoctor.ID,
            null,
            { doctor_name, doctor_phone_no },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(201).json({
            message: "Doctor created successfully",
            success: true,
            data: newDoctor,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Failed to create doctor",
            success: false
        });
    }
};

const updateDoctors = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { doctor_name, doctor_phone_no } = req.body;

        const doctor = await DoctorDetails.findByPk(id);
        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
                success: false
            });
        }

        const oldData = { doctor_name: doctor.doctor_name, doctor_phone_no: doctor.doctor_phone_no };

        await doctor.update({
            doctor_name: doctor_name || doctor.doctor_name,
            doctor_phone_no: doctor_phone_no || doctor.doctor_phone_no
        });

        // Log doctor update
        await logActivity(
            req.user?.userId || null,
            "Updated Doctor Information",
            "Doctor",
            doctor.ID,
            oldData,
            { doctor_name, doctor_phone_no },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(200).json({
            message: "Doctor updated successfully",
            success: true,
            data: doctor,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Failed to update doctor",
            success: false
        });
    }
};

const getOneDoctor = async (req, res, next) => {
    try {
        const { id } = req.params;
        const doctor = await DoctorDetails.findByPk(id);

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
                success: false,
            });
        }

        // Log doctor detail retrieval
        await logActivity(
            req.user?.userId || null,
            "Retrieved Doctor Details",
            "Doctor",
            doctor.ID,
            null,
            { doctor_id: doctor.ID, doctor_name: doctor.doctor_name },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(200).json({
            message: "Doctor details retrieved successfully",
            success: true,
            data: doctor,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Failed to get the doctor's details",
            success: false,
        });
    }
};

const deleteDoctors = async (req, res, next) => {
    try {
        const { id } = req.params;
        const doctor = await DoctorDetails.findByPk(id);

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
                success: false,
            });
        }

        await doctor.update({ is_deleted: true });

        // Log doctor deletion
        await logActivity(
            req.user?.userId || null,
            "Deleted Doctor",
            "Doctor",
            doctor.ID,
            { doctor_name: doctor.doctor_name, doctor_phone_no: doctor.doctor_phone_no },
            { is_deleted: true },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(200).json({
            message: "Doctor deleted successfully",
            success: true,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Failed to delete selected doctor",
            success: false,
        });
    }
};

export {
    getDoctors,
    createDoctors,
    updateDoctors,
    getOneDoctor,
    deleteDoctors
};
