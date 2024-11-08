import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";

const DoctorDetails = sequelize.define("DoctorDetails", {
    ID: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    doctor_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    doctor_phone_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_deleted: {
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
    tableName: 'doctor_details', // Specify the table name
    timestamps: false,   // Disable timestamps if not needed
  });

export default DoctorDetails;

