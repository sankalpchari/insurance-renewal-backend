import Settings from "../models/setting.model.js";

// Get all settings
export const getSettings = async (req, res) => {
    try {
        const settings = await Settings.findAll();
        return res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve settings." });
    }
};

// Update multiple settings
export const updateSettings = async (req, res) => {
    try {
        const settingsArray = req.body; // Expecting an array of { key, value } objects

        if (!Array.isArray(settingsArray) || settingsArray.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid input format. Expected an array of key-value pairs." });
        }

        // Process each setting individually
        for (const { key, value } of settingsArray) {
            if (!key || value === undefined) {
                return res.status(400).json({ success: false, message: "Each setting must have a key and a value." });
            }

            const setting = await Settings.findOne({ where: { key } });

            if (setting) {
                // Update existing setting
                await setting.update({ value });
            } else {
                // Create new setting
                await Settings.create({ key, value });
            }
        }

        return res.status(200).json({ success: true, message: "Settings updated successfully." });

    } catch (error) {
        console.error("Error updating settings:", error);
        return res.status(500).json({ success: false, message: "Failed to update settings." });
    }
};
