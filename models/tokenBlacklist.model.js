import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; // Adjust the path as necessary

const TokenBlacklist = sequelize.define('TokenBlacklist', {
    token: {
        type: DataTypes.STRING,
        allowNull: false,
      //  unique: true,
    },
    expiry: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    tableName: 'token_blacklist',
    timestamps: false,
    indexes: [
        {
          unique: true,
          fields: ["token"],
        }
      ]
});

export default TokenBlacklist;