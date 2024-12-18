import User from "../models/users.model.js";
import Roles from "../models/roles.model.js";
import bcrypt from 'bcrypt';

export const getUserDetails = async(req, res)=>{
    try{

        const {userId} = req.user;

        const user = await User.findOne({   
            where:{
                ID : userId 
            },
            include:[
                {
                    model: Roles,
                    as: 'Role',
                    required: true
                }
            ],
            attributes:{
                include : [
                    "ID",
                    "f_name",
                    "l_name",
                    "email",
                    "role_id",
                    "is_deleted",
                    "date_created",
                ]
            },
        });

        if(user){
            return res.status(200).json({
                "message":"User found",
                "success":true,
                "data":user
            })
        }else{
            return res.status(404).json({
                "message":"User not found",
                "success":false,
                "data":[]
            })
        }
    }catch(e){
        console.log(e);
        return res.status(500).json({
            "message":"Failed to get users details",
            "success":false
        })
    }
};

export const updateUserPassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const {userId} = req.user;

        // Find user by ID
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if the old password matches
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Incorrect old password",
                success: false
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update the password in the database
        await User.update(
            { password: hashedPassword },
            { where: { id: userId } }
        );

        return res.status(200).json({
            message: "Password updated successfully",
            success: true
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            message: "An error occurred while updating the password",
            success: false
        });
    }
};