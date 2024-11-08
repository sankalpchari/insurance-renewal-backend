import dotenvx from "@dotenvx/dotenvx";
dotenvx.config(); 
import mysql2 from "mysql2";
import { Sequelize } from "sequelize";

// Initialize Sequelize with MySQL connection
  let sequelize;
  const DB_NAME = process.env.DB_NAME;
  const DB_USER = process.env.DB_USER;
  const DB_PASSWORD = process.env.DB_PASSWORD;
  const DB_HOST = process.env.DB_HOST || "localhost";

  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: "mysql",
    dialectModule: mysql2,
   logging: false,
  });

  // Test the connection
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully!");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
    process.exit(1); // Exit the app if the connection fails
  }



export default sequelize;
