import User from "../models/users.model.js";
import sequelize, { Op, fn, col, where } from "sequelize";
import Roles from "../models/roles.model.js";
import bcrypt from 'bcrypt';
import { logActivity } from "../utils/logger.js";

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

        const roles = await Roles.findAll({
            where:{
                is_deleted:0
            }, 
            raw:true
        });

       
        const requestingUserRoleName = roles.find((role)=>{
            if(role.ID == requestingUser.role_id){
                return role;
            }
        })


        console.log(requestingUserRoleName, "requestingUserRoleName")

        if (!requestingUser || requestingUserRoleName.role_name !== "admin") {
            return res.status(403).json({
                message: "Unauthorized: Only admins can delete users",
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


        const userRoleName = roles.find((role)=>{
            if(role.ID == user.role_id){
                return role;
            }
        })

        // Prevent an admin from deleting another admin
        if (userRoleName.role_name === "admin") {
            return res.status(403).json({
                message: "Unauthorized: You cannot delete another admin",
                success: false
            });
        }

        // Update is_deleted to true
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

