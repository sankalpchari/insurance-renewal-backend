import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";

const InsuranceProvider = sequelize.define("InsuranceProvider", {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    provider_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    provider_code:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone_no_1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_no_2: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    logo_location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provider_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Default to not deleted
    },
    is_default:{
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Default to not deleted
    },
    date_created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Automatically set to current date
    },
  }, {
    tableName: 'insurance_provider', // Specify the table name
    timestamps: false,   // Disable timestamps if not needed
    indexes: [
      {
        unique: true,
        fields: ["ID"],
      }
    ]
  });

export default InsuranceProvider;

