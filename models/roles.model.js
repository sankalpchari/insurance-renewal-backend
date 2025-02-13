import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";


// Define the User model
const Roles = sequelize.define("Roles", {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    role_name: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    sort_order:{
        type: DataTypes.INTEGER,
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
    tableName: 'roles',
    timestamps: false,
    indexes: [
        {
          unique: true,
          fields: ["ID"],
        }
      ]
});


export default Roles