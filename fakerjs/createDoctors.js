// Load Faker and the DoctorDetails model
import { faker } from '@faker-js/faker';
import DoctorDetails from '../models/doctors.model.js'; // Update with your model path
import sequelize from '../config/db.js'; // Ensure your DB config path is correct

// Function to generate fake doctor data
async function createFakeDoctors() {
  const doctorsData = [];

  for (let i = 0; i < 10; i++) { // Change 10 to however many records you need
    doctorsData.push({
      doctor_name: faker.person.fullName(),
      doctor_phone_no: faker.phone.number('###-###-####'), // Format for phone number
    });
  }

  try {
    await sequelize.sync(); // Ensure DB is connected and synced
    await DoctorDetails.bulkCreate(doctorsData); // Insert fake data
    console.log('Fake doctor data created successfully!');
  } catch (error) {
    console.error('Error creating fake doctor data:', error);
  } finally {
    await sequelize.close(); // Close DB connection after seeding
  }
}

// Run the function
createFakeDoctors();
