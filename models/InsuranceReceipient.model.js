import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";
import DoctorDetails from './doctors.model.js';

const InsuranceReceipient = sequelize.define("InsuranceReceipient", {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    recipient_ma: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    prsrb_prov: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    recipient_type: {
        type: DataTypes.ENUM('MW', 'REM', 'REM OPT'),
        allowNull: false,
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    date_created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'insurance_receipient',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ["ID"],
        },
        {
            fields: ["doctor_id"] // Added index for foreign key
        },
        {
            fields: ["recipient_ma"], // Added index for frequently queried field
        }
    ]
});

// Define the association with Doctor model
InsuranceReceipient.associate = (models) => {
    InsuranceReceipient.belongsTo(models.DoctorDetails, {
        foreignKey: 'doctor_id',
        as: 'Doctor'
    });
};

DoctorDetails.associate = (models) => {
    DoctorDetails.hasMany(models.InsuranceReceipient, { 
        foreignKey: 'doctor_id',  // This must match the foreign key used in belongsTo
        as: 'InsuranceReceipient'  // Alias should be different from the one in belongsTo
    });
};


export default InsuranceReceipient;