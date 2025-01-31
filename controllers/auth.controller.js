import bcrypt from "bcrypt";
import User from "../models/users.model.js";
import TokenBlacklist from "../models/tokenBlacklist.model.js";

const loginUser = async (req, res) => {
    const { email, password } = req.body; // Extract email and password from request body
    console.log(email,password);
    try {
        // Find the user by email
        const user = await User.findOne({ where: { email:email } });
        console.log(user,"user");

        // If user not found, return error
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Compare the provided password with the hashed password
        const isMatch = await user.comparePassword(password);

        // If password doesn't match, return error
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Create a JWT token
        const token = user.createJWT();

        // Return user data and token
        return res.status(200).json({
            userId: user.ID,
            email: user.email,
            role: user.role_id, // Or use user.role for the role name if you have it in the user model
            name : user.f_name + " " + user.l_name,
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
        // Validate required fields
        if (!f_name || !l_name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if the email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Create a new user
        const newUser = await User.create({
            f_name,
            l_name,
            email,
            password,
            role_id: role || 'user', // Default role to 'user' if not provided
        });

        // Respond with the new user's information (excluding the password)
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
        // Set token expiry (e.g., token expiration time)
        const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        // Save to blacklist
        await TokenBlacklist.create({ token, expiry });
        return res.status(200).json({ message: 'Logged out successfully.' });
    }
    return res.status(400).json({ message: 'No token provided.' });
};




export {
    loginUser,
    signup,
    logout
}


