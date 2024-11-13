import { DataTypes , Sequelize} from 'sequelize';
import sequelize from "../config/db.js";
import InsuranceProvider from './InsuranceProvider.model.js';
import DoctorDetails from './doctors.model.js'; // Ensure the correct import path
import InsuranceReceipient from "./InsuranceReceipient.model.js"

const InsuranceDetails = sequelize.define("InsuranceDetails", {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    provider_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    recipient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    prsrb_prov: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pa: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    from_service_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    to_service_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    recipient_is: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    procedure_code: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    units: {
        type: DataTypes.INTEGER, // Use INTEGER for unit count
        allowNull: false,
    },
    plan_of_care: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    number_of_days: {
        type: DataTypes.INTEGER, // Use INTEGER for days count
        allowNull: false,
    },
    max_per_day: {
        type: DataTypes.INTEGER, // Use INTEGER for max per day
        allowNull: false,
    },
    max_per_day_unit: {
        type: DataTypes.INTEGER, // Use INTEGER for units
        allowNull: false,
    },
    insurance_status: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    mmis_entry: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    rsn: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    comment_pa: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_deleted:{
        type:DataTypes.BOOLEAN,
        defaultValue: false, 
    },
    is_active:{
        type:DataTypes.BOOLEAN,
        defaultValue: true, 
    },
    is_email_sent:{
        type:DataTypes.BOOLEAN,
        defaultValue: false, 
    },
    pdf_location:{
        type:DataTypes.STRING,
        defaultValue: null, 
    }
}, {
    tableName: 'insurance_details',
    timestamps: false,
});

// Set up associations
InsuranceProvider.hasMany(InsuranceDetails, {
    foreignKey: 'provider_id',
    sourceKey: 'ID'
});

InsuranceDetails.belongsTo(InsuranceProvider, {
    foreignKey: 'provider_id',
    targetKey: 'ID'
});

// Link InsuranceDetails to DoctorDetails
DoctorDetails.hasMany(InsuranceDetails, {
    foreignKey: 'doctor_id',
    sourceKey: 'ID'
});

InsuranceDetails.belongsTo(DoctorDetails, {
    foreignKey: 'doctor_id',
    targetKey: 'ID'
});

// link insurance details to receipients 
// Link InsuranceDetails to DoctorDetails
InsuranceReceipient.hasMany(InsuranceDetails, {
    foreignKey: 'recipient_id',
    sourceKey: 'ID'
});

InsuranceDetails.belongsTo(InsuranceReceipient, {
    foreignKey: 'recipient_id',
    targetKey: 'ID'
});

export default InsuranceDetails;
