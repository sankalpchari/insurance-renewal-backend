import { DataTypes } from 'sequelize';
import sequelize from "../config/db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import Roles from './roles.model.js';
import EmailStatus from './emailStatus.model.js';

// Define the User model
const User = sequelize.define("User", {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    f_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    l_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
       // unique: true,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: Roles,
          key: 'ID',
      },
    },
    permission:{
        type: DataTypes.TEXT,
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
    tableName: 'users',
    timestamps: false,
    indexes: [
        {
          unique: true,
          fields: ["ID", 'email'],
        }
      ]
});

// Before creating or updating a user, hash the password and lowercase email/username
User.beforeSave(async (user) => {
    if (user.changed('password')) { // Check if password is being modified
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }

});

// Compare password method
User.prototype.comparePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
};

// Create JWT method
User.prototype.createJWT = function () {
    return jwt.sign(
        {
            userId: this.ID, // Use 'this.ID' for Sequelize model
            email: this.email,
            role: this.role_id,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_TOKEN_EXP, // Set expiration for the token
        }
    );
};


Roles.hasMany(User, {
  foreignKey: 'role_id',
  sourceKey: 'ID',
});

User.belongsTo(Roles, {
  foreignKey: 'role_id',
  targetKey: 'ID',
});

User.hasMany(EmailStatus, {
    foreignKey: 'user_initiated',
    sourceKey: 'ID'
});

EmailStatus.belongsTo(User, {
    foreignKey: 'user_initiated',
    targetKey: 'ID',
});



export default User;
