import sequelize from "../config/db.js";
import User from "./users.model.js";
import InsuranceProvider from "./InsuranceProvider.model.js";
import InsuranceDetails from "./insuranceDetails.model.js";
import DoctorDetails from "./doctors.model.js";
import Roles from "./roles.model.js";
import TokenBlacklist from "./tokenBlacklist.model.js";
import InsuranceReceipient from "./InsuranceReceipient.model.js";
import EmailStatus from "./emailStatus.model.js";
import ActivityTracker from "./activityTracker.model.js";
import Settings from "./setting.model.js";

// Function to initialize default roles
const initializeRoles = async () => {
    try {
        // Define the default roles
        const roles = [
            { role_name: 'super_admin', sort_order: 1 },
            { role_name: 'admin', sort_order: 2 },
            { role_name: 'user', sort_order: 3 }
        ];

        // Loop through the roles and insert them if they don't already exist
        for (const role of roles) {
            const [roleInstance, created] = await Roles.findOrCreate({
                where: { role_name: role.role_name },
                defaults: role, // Only set defaults if the role doesn't exist
            });

            if (created) {
                console.log(`Role "${roleInstance.role_name}" created.`);
            } else {
                console.log(`Role "${roleInstance.role_name}" already exists.`);
            }
        }
    } catch (error) {
        console.error('Error initializing roles:', error);
    }
};



export const syncDatabase = async () => {
    try {
        const models = {
            User,
            InsuranceProvider,
            InsuranceDetails,
            DoctorDetails,
            Roles,
            TokenBlacklist,
            InsuranceReceipient,
            EmailStatus,
            ActivityTracker,
            Settings
        };

        // Apply associations before syncing
        Object.keys(models).forEach(modelName => {
            if (models[modelName].associate) {
                models[modelName].associate(models);
            }
        });

        // Sync database after associations are defined
        await sequelize.sync({ alter: true });

        await initializeRoles();
    } catch (error) {
        console.error('Error synchronizing database:', error);
    }
};





syncDatabase();
