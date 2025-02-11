import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./users.model.js"; // Ensure the correct path to the User model

const ActivityTracker = sequelize.define(
  "ActivityTracker",
  {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User, // Sequelize should use the actual model reference
        key: "ID",
      },
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment:
        "Describes the user action (e.g., 'Login', 'Viewed Record', 'Updated Profile')",
    },
    entity: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment:
        "The type of entity affected (e.g., 'PatientRecord', 'InsuranceDetails')",
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "The ID of the specific entity affected, if applicable",
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment:
        "Additional JSON details about the action (e.g., before/after changes)",
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "IP address of the user performing the action",
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Device or browser information of the user",
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      comment: "Timestamp of when the action occurred",
    },
  },
  {
    tableName: "activity_logs",
    timestamps: false, // Set to true if you want Sequelize to handle timestamps
    hooks: {
      beforeCreate: (log) => {
        log.timestamp = new Date();
      },
    },
  }
);

// Establishing associations
ActivityTracker.belongsTo(User, { foreignKey: "user_id", as: "User" });

export default ActivityTracker;
