import ActivityTracker from "../models/activityTracker.model.js";

export const logActivity = async (user_id, action, entity, entity_id, oldData={}, newData={}, ip_address = null, user_agent = null) => {
    try {
        await ActivityTracker.create({
            user_id,
            action,
            entity,
            entity_id,
            details: JSON.stringify({ oldData, newData }), // Storing changes
            ip_address,
            user_agent,
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};
