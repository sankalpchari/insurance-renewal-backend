import  express from "express";
import  multer from "multer";
import  path from "path";


const app = express();
const rootPath = process.cwd();

// Set storage engine
const storage = multer.diskStorage({
    destination: path.join(rootPath,"/uploads"), 
    filename: (req, file, cb) => {

        const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.'));
        const timestamp = Date.now();

        cb(null, `${timestamp}${fileExtension}`);
    }, 
});

// Initialize upload with options
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/; // Allowed file types
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        console.log("called")
        if (extname && mimetype) {
           console.log("called")
            return cb(null, true);
        } else {
            cb(new Error("Only images are allowed"));
        }
    }
});


const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Handle multer-specific errors (like file size limit)
        return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
        // Handle custom errors from fileFilter
        return res.status(400).json({ success: false, message: err.message });
    }
    next(); // Proceed if no error
};


export {
    upload,
    handleUploadError
}