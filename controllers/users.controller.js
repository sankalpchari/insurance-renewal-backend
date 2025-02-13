import User from "../models/users.model.js";
import sequelize, { Op, fn, col, where } from "sequelize";
import Roles from "../models/roles.model.js";
import bcrypt from 'bcrypt';
import { logActivity } from "../utils/logger.js";
import {sendMailgunEmail, createEmailBody} from "../services/email.service.js";
import handlebars from "handlebars";
import crypto from "crypto"

export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.user;

        const user = await User.findOne({   
            where: { ID: userId },
            include: [
                {
                    model: Roles,
                    as: 'Role',
                    required: true
                }
            ],
            attributes: [
                "ID",
                "f_name",
                "l_name",
                "email",
                "role_id",
                "is_deleted",
                "date_created"
            ],
        });

        if (user) {
            // Log user details retrieval
            await logActivity(
                userId,
                "Viewed User Details",
                "User",
                userId,
                null, 
                { user_id: userId },
                req.ip,
                req.headers['user-agent']
            );

            return res.status(200).json({
                message: "User found",
                success: true,
                data: user
            });
        } else {
            return res.status(404).json({
                message: "User not found",
                success: false,
                data: []
            });
        }
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Failed to get user details",
            success: false
        });
    }
};

export const getUsersList = async (req, res) => {
    try {
        const {
            search_term = "",
            dateCreated = "",
            sort_by = "f_name",
            sort_order = "asc",
            records_per_page = 10,
            page = 1
        } = req.query;

        const limit = parseInt(records_per_page);
        const offset = (parseInt(page) - 1) * limit;

        let whereClause = {};
        
        if (search_term) {
            whereClause[Op.or] = [
                { f_name: { [Op.iLike]: `%${search_term}%` } },
                { email: { [Op.iLike]: `%${search_term}%` } }
            ];
        }

        if (dateCreated) {
            whereClause.createdAt = { [Op.gte]: new Date(dateCreated) };
        }

        whereClause.is_deleted = 0

        const { count: totalRecords, rows } = await User.findAndCountAll({
            where: whereClause,
            order: [[sort_by, sort_order.toLowerCase() === "desc" ? "DESC" : "ASC"]],
            limit,
            offset,
            attributes: [
                "ID",
                "f_name",
                "l_name",
                "email",
                "role_id",
                [fn("DATE", col("User.date_created")), "date_created"],
                [fn("NOT", col("User.is_deleted")), "active"],
                [col('Role.role_name'), 'role_name'],
               
            ],
            include: [
                {
                    model: Roles,
                    as: 'Role',
                    required: true,
                    attributes:["role_name"]
                }
            ],
            raw:true,
        });

        return res.status(200).json({
            message: "Users retrieved successfully",
            success: true,
            data: rows,
            pagination: {
                totalRecords,
                totalPages: limit ? Math.ceil(totalRecords / limit) : 1,
                currentPage: parseInt(page),
                recordsPerPage: limit || totalRecords
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "An error occurred while getting the user list",
            success: false
        });
    }
};

export const updateUserPassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const { userId } = req.user;

        // Find user by ID
        const user = await User.findOne({ where: { ID: userId } });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if the old password matches
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Incorrect old password",
                success: false
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update the password in the database
        await User.update(
            { password: hashedPassword },
            { where: { ID: userId } }
        );

        // Log password update
        await logActivity(
            userId,
            "Updated Password",
            "User",
            userId,
            { password: user.password }, // Old hashed password
            { password: hashedPassword }, // New hashed password
            req.ip,
            req.headers['user-agent']
        );

        return res.status(200).json({
            message: "Password updated successfully",
            success: true
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "An error occurred while updating the password",
            success: false
        });
    }
};


export const getUserById = async(req, res)=>{
    try {
        const { id } = req.params;
        const { userId } = req.user;

        const user = await User.findOne({   
            where: { ID: userId },
            include: [
                {
                    model: Roles,
                    as: 'Role',
                    required: true
                }
            ],
            attributes: [
                "ID",
                "f_name",
                "l_name",
                "email",
                "role_id",
                [fn("DATE", col("User.date_created")), "date_created"],
                [fn("NOT", col("User.is_deleted")), "active"],
                [col('Role.role_name'), 'role_name'],
               
            ],
        });

        if (user) {
            // Log user details retrieval
            await logActivity(
                userId,
                "Viewed User Details",
                "User",
                id,
                null, 
                { user_id: userId , viewedUser:id},
                req.ip,
                req.headers['user-agent']
            );

            return res.status(200).json({
                message: "User found",
                success: true,
                data: user
            });
        } else {
            return res.status(404).json({
                message: "User not found",
                success: false,
                data: []
            });
        }
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "Failed to get user details",
            success: false
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;

        // Fetch the requesting user
        const requestingUser = await User.findOne({ where: { ID: userId } });

        if (!requestingUser) {
            return res.status(403).json({
                message: "Unauthorized: User not found",
                success: false
            });
        }

        // Prevent a user from deleting themselves
        if (userId == id) {
            return res.status(403).json({
                message: "You cannot delete your own account",
                success: false
            });
        }

        // Get all active roles
        const roles = await Roles.findAll({ where: { is_deleted: 0 }, raw: true });
        
        const requestingUserRoleName = roles.find(role => role.ID == requestingUser.role_id)?.role_name;

        if (requestingUserRoleName !== "admin") {
            return res.status(403).json({
                message: "Unauthorized: Only admins can delete users",
                success: false
            });
        }

        // Check if there is more than one user
        const userCount = await User.count({ where: { is_deleted: 0 } });
        if (userCount <= 1) {
            return res.status(403).json({
                message: "Unauthorized: You cannot delete the last user",
                success: false
            });
        }

        // Fetch the target user
        const user = await User.findOne({ where: { ID: id } });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const userRoleName = roles.find(role => role.ID == user.role_id)?.role_name;

        // Prevent an admin from deleting another admin
        if (userRoleName === "admin") {
            return res.status(403).json({
                message: "Unauthorized: You cannot delete another admin",
                success: false
            });
        }

        // Soft delete user
        user.is_deleted = 1;
        await user.save();

        // Log the deletion action
        await logActivity(
            userId, "delete", "user", id,
            user.toJSON(), { is_deleted: true },
            req.ip, req.headers['user-agent']
        );

        return res.status(200).json({
            message: "User deleted successfully",
            success: true
        });
    } catch (e) {
        console.error("Error deleting user:", e);
        return res.status(500).json({
            message: "Failed to delete user details",
            success: false
        });
    }
};


export const createUser = async (req, res) => {
    try {
        const { f_name, l_name, email, role_id } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists",
                success: false
            });
        }

        // Generate random password if not provided
        const randomPassword = crypto.randomBytes(8).toString("hex");

        // Create user
        const newUser = await User.create({
            f_name,
            l_name,
            email,
            password:randomPassword,
            role_id,
            is_deleted: 0
        });

        const emailBody = createEmailBody("accountCreation", {
            f_name,
            l_name,
            email: "sankalpchari@gmail.com",
            tempPassword: randomPassword,
            loginUrl: process.env.FE_URL
        });

        await sendMailgunEmail({
            to: "sankalpchari@gmail.com",
            subject: "Your New Account Details",
            html: emailBody
        })

        return res.status(201).json({
            message: "User created successfully",
            success: true,
            data: newUser
        });
    } catch (e) {
        console.error("Error creating user:", e);
        return res.status(500).json({
            message: "Failed to create user",
            success: false
        });
    }
};


export const getRoles = async(req, res)=>{
    try{
        console.log("roles called");
        const roles = await Roles.findAll({ 
            where: { is_deleted: 0 }, 
            raw: true, 
            order: [["sort_order", "ASC"]] // Order by sort_order in ascending order
        });
        console.log(roles);
        return res.status(200).json({
                message: "Roles fetched successfully",
                success: true,
                data : roles
        });

    }catch(e){
        console.error("Error deleting user:", e);
        return res.status(500).json({
            message: "Failed to get user roles",
            success: false
        });
    }
}