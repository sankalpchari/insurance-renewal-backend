import bcrypt from "bcrypt";
import User from "../models/users.model.js";
import TokenBlacklist from "../models/tokenBlacklist.model.js";
import { logActivity } from "../utils/logger.js";
import {parseJwtExpiry} from "../utils/helpers.js";

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        console.log(user, "user1");
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        console.log(user, "user2");
        if(user.is_deleted == 1){
            return res.status(401).json({ message: 'Your account is no longer active, please contact admin.' });
        }
        console.log(user, "user3");
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log("password does not match")
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = user.createJWT();
        console.log(user, "user4");
        // Log user login activity
        await logActivity(
            user.ID,
            "User Login",
            "User",
            user.ID,
            null,
            { user_id: user.ID, email: user.email },
            req.ip,
            req.headers['user-agent']
        );

        const expiryInSeconds = parseJwtExpiry(process.env.JWT_TOKEN_EXP)
        const tokenExpiryTimestamp = Math.floor(Date.now() / 1000) + expiryInSeconds;

        return res.status(200).json({
            userId: user.ID,
            email: user.email,
            role: user.role_id,
            name: user.f_name + " " + user.l_name,
            token,
            permission:user.permission,
            tokenExpiryTimestamp
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

const signup = async (req, res) => {
    const { f_name, l_name, email, password, role } = req.body;

    try {
        if (!f_name || !l_name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        const newUser = await User.create({
            f_name,
            l_name,
            email,
            password,
            role_id: role,
        });

        // Log user registration
        await logActivity(
            newUser.ID,
            "User Signup",
            "User",
            newUser.ID,
            null,
            { user_id: newUser.ID, email: newUser.email },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(201).json({
            id: newUser.ID,
            email: newUser.email,
            role: newUser.role,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const logout = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 

        await TokenBlacklist.create({ token, expiry });

        // Log user logout
        await logActivity(
            req.user?.userId || null,
            "User Logout",
            "User",
            req.user?.userId || null,
            null,
            { token },
            req.ip,
            req.headers['user-agent']
        );

        return res.status(200).json({ message: 'Logged out successfully.' });
    }
    
    return res.status(400).json({ message: 'No token provided.' });
};

export { loginUser, signup, logout };
