import {userCreate} from "../validations/users.validations.js"

export const passwordValidation = (req, res, next) => {
    const { new_password } = req.body;
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!new_password || !passwordRegex.test(new_password)) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long, contain at least one special character, and one number.",
            success: false
        });
    }
    next();
};

export const validateUser = (req, res, next) => {
    console.log(req.body);
    const { error } = userCreate.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: error.details.map(err => err.message).join(", "),
            success: false
        });
    }
    next();
};
