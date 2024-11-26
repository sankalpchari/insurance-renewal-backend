import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";

const EmailStatus = sequelize.define('EmailStatus', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    combined_pdf_location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    renewal_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    insurance_ids: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
    },
    user_initiated: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users', // Assumes a 'users' table exists in your database
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    email_status: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'pending'
    },
    email_response: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, {
    tableName: 'email_status', // Define the table name explicitly if necessary
    timestamps: false // Disable Sequelize's automatic timestamp columns (createdAt, updatedAt)
});

export default EmailStatus;
