import {userCreate} from "../validations/users.validations.js"
import Roles from "../models/roles.model.js";
import { where } from "sequelize";

export const passwordValidation = (req, res, next) => {
    const { new_password } = req.body;
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!new_password || !passwordRegex.test(new_password)) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long, contain at least one special character, and one number.",
            success: false
        });
    }
    next();
};

export const validateUser = async (req, res, next) => {
    const { error } = await userCreate.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(", "),
            success: false
        });
    }

    const { role_id, permission } = req.body;
    const hideUserRoleModule = ["users", "settings", "company"];

    // Check if the role exists in the database
    const userRole = await Roles.findOne({
        where: {
            ID: role_id
        },
        raw: true
    });

    if (!userRole) {
        return res.status(400).json({
            message: "The Role is not a valid role, please select a proper role for the user",
            success: false
        });
    }

    const { role_name } = userRole;

    // Check if the role is 'user' and validate permissions
    if (role_name === "user") {
        const hasInvalidPermissions = permission.some(menuItem => {
            // Check if the module is restricted for the user
            if (hideUserRoleModule.includes(menuItem.key)) {
                // If the module is restricted, check if any permission is true
                return Object.values(menuItem.permissions).some(perm => perm === true);
            }
            return false;
        });

        if (hasInvalidPermissions) {
            return res.status(400).json({
                message: "User role cannot have permissions for restricted modules.",
                success: false
            });
        }
    }

    // Check if any permission is given (applicable to all roles)
    const hasValidPermissions = permission.some(menuItem => {
        // Skip restricted modules
        if (hideUserRoleModule.includes(menuItem.key)) {
            return false;
        }

        // Check if at least one permission is true
        return Object.values(menuItem.permissions).some(perm => perm === true);
    });

    if (!hasValidPermissions) {
        return res.status(400).json({
            message: "At least one valid permission is required.",
            success: false
        });
    }

    next();
};




