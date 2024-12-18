

export const passwordValidation = (req, res, next) => {
    const { new_password } = req.body;
    console.log(new_password,"new_password");
    // Regular expression for password validation
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    // Check if the new password meets the criteria
    if (!new_password || !passwordRegex.test(new_password)) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long, contain at least one special character, and one number.",
            success: false
        });
    }
    next();
};
