import DoctorDetails from "../models/doctors.model.js";

const getDoctors = async (req, res, next) => {
    try {
      // Extract query parameters for filtering, sorting, and limiting
      const { sortField = 'doctor_name', sortOrder = 'asc', limit = 10, page = 1 } = req.query;
  
      // Prepare options for Sequelize query
      const options = {
        where: { is_deleted: 0 }, // Only get active (not deleted) doctors
        order: [[sortField, sortOrder]], // Sort based on query parameters
      };
  
      // If limit is not 'all', add limit and offset options
      if (limit !== 'all') {
        options.limit = parseInt(limit); // Limit the number of results
        options.offset = (parseInt(page) - 1) * parseInt(limit); // Calculate the offset
      }
  
      // Fetch doctors from database with the specified options
      const doctors = await DoctorDetails.findAll(options);
  
      return res.status(200).json({
        message: "Doctors retrieved successfully",
        success: true,
        data: doctors,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({
        message: "Failed to get the doctors",
        success: false,
      });
    }
  };

const createDoctors = async (req, res, next) => {
    try {
        const { doctor_name, doctor_phone_no } = req.body;

        // Validate required fields
        if (!doctor_name || !doctor_phone_no) {
            return res.status(400).json({
                message: "doctor_name and doctor_phone_no are required",
                success: false
            });
        }

        // Create the new doctor in the database
        const newDoctor = await DoctorDetails.create({
            doctor_name,
            doctor_phone_no,
            is_deleted: false, // Set default value
            date_created: new Date() // Automatically set creation date
        });

        return res.status(201).json({
            message: "Doctor created successfully",
            success: true,
            data: newDoctor,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Failed to create doctor",
            success: false
        });
    }
};


const updateDoctors = async (req, res, next) => {
    try {
        const { id } = req.params; // ID of the doctor to update
        const { doctor_name, doctor_phone_no } = req.body; // Updated fields from request body

        // Check if the doctor exists
        const doctor = await DoctorDetails.findByPk(id);
        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
                success: false
            });
        }

        // Update the doctor with new data
        await doctor.update({
            doctor_name: doctor_name || doctor.doctor_name, // Only update if provided
            doctor_phone_no: doctor_phone_no || doctor.doctor_phone_no // Only update if provided
        });

        return res.status(200).json({
            message: "Doctor updated successfully",
            success: true,
            data: doctor,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Failed to update doctor",
            success: false
        });
    }
};

const getOneDoctor = async (req, res, next) => {
    try {
        const { id } = req.params; // Extract doctor ID from request parameters

        // Find the doctor by primary key
        const doctor = await DoctorDetails.findByPk(id);

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
                success: false,
            });
        }

        return res.status(200).json({
            message: "Doctor details retrieved successfully",
            success: true,
            data: doctor,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Failed to get the doctor's details",
            success: false,
        });
    }
};

const deleteDoctors = async (req, res, next) => {
    try {
        const { id } = req.params; // Extract doctor ID from request parameters

        // Find the doctor by primary key
        const doctor = await DoctorDetails.findByPk(id);

        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found",
                success: false,
            });
        }

        // Soft delete by setting `is_deleted` to true
        await doctor.update({ is_deleted: true });

        return res.status(200).json({
            message: "Doctor deleted successfully",
            success: true,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            message: "Failed to delete selected doctor",
            success: false,
        });
    }
};

export {
    getDoctors,
    createDoctors,
    updateDoctors,
    getOneDoctor,
    deleteDoctors
}