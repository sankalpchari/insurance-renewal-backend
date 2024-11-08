import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";


// Define the User model
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
    receipient_ma: {
        type: DataTypes.STRING,
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
});


export default InsuranceReceipient