import User from "../models/users.model.js";
import Roles from "../models/roles.model.js";

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