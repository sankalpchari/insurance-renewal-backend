import CacheService from "../config/cache.js";
import User from "../models/users.model.js";
import { where } from "sequelize";
export const checkPermission = async (req, res, next) => {
    try {
        // Ensure `user` exists
        if (!req.user || !req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" , success:false });
        }

        const { user } = req;
        const key = `permission_${user.userId}`;
        let permission = [];

        // Try to get permission from cache
        const data = CacheService.get(key); // No need for `await`
        if (data) {
            console.log("cache hit");
            permission = data;
        } else {
            console.log("cache miss");
            const userData = await User.findOne({
                where: { ID: user.userId },
                attributes: ["permission"],
                raw: true
            });

            if (userData?.permission) {
                permission = JSON.parse(userData.permission);
                CacheService.set(key, permission, 10800); // Cache for 3 hours
            }
        }

        // Ensure permission array is valid
        if (!Array.isArray(permission)) {
            return res.status(403).json({ message: "Invalid permissions format" , success:false });
        }

        // Get the current route action from the HTTP method and endpoint
        const action = req.method.toLowerCase();

        // Define the required permissions for each action
        const permissionMapping = {
            post: "create",
            get: "read",
            patch: "update",
            delete: "delete"
        };

        let requiredPermission = permissionMapping[action];
        let urlPath = req.originalUrl.replace(/^\/api\/v1\//, ""); // Remove "/api/v1/"
        let urlSplit = urlPath.split("?")[0].split("/");
        let module = urlSplit[0];
        console.log(urlSplit);
        switch(module){
            case "insurance":
                    module =  "authorizations";
                    if(urlSplit[1] == "provider"){
                        module = "accounts"
                    }

                    if(urlSplit[1] == "download-pdf"){
                        requiredPermission = "downloadPdf"
                    }
                    if(urlSplit[1] == "generate-pdf"){
                        requiredPermission = "generatePdf"
                    }

                break;
            case "insurance-receipient":
                module = "clients"
                break;
        }
        

        // Check if the user has the required permission for the action
        const userPerm = permission.find((perm) => perm.key === module)?.permissions || [];
        const hasPermission = userPerm[requiredPermission];

        if (!hasPermission) {
            return res.status(403).json({ message: "Forbidden: You do not have permission" , success:false });
        }

        // Attach user permissions to the request object for later use
        req.userPermissions = userPerm;
        console.log("here, successfully completed")
        next();
    } catch (e) {
        console.error("Permission Check Error:", e);
        return res.status(500).json({  message: "Internal Server Error", success:false  });
    }
};
