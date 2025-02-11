import bcrypt from "bcrypt";
import User from "../models/users.model.js";
import TokenBlacklist from "../models/tokenBlacklist.model.js";
import { logActivity } from "../utils/logger.js";

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = user.createJWT();

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

        return res.status(200).json({
            userId: user.ID,
            email: user.email,
            role: user.role_id,
            name: user.f_name + " " + user.l_name,
            token,
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
            role_id: role || 'user',
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
