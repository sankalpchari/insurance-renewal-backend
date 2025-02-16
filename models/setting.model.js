import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; // Adjust the path as necessary

const Settings = sequelize.define('Settings', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    value:{
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'settings',
    timestamps: false,
    indexes: [
        {
          unique: true,
          fields: ["ID"],
        }
      ]
});

export default Settings;