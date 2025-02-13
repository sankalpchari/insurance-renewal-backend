import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, "../templates","email"); // Adjust path as needed
/**
 * Send an email using Mailgun's SMTP service
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient's email address
 * @param {string} options.subject - Subject of the email
 * @param {string} options.text - Plain text content of the email
 * @param {string} [options.html] - HTML content of the email
 * @returns {Promise<void>} Resolves if email is sent successfully
 */
export const sendMailgunEmail = async (emailOptions) => {
  try {
    // Create a nodemailer transporter with Mailgun SMTP credentials
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_DOMAIN, // Mailgun's SMTP server
      port: process.env.SMTP_PORT,               // Default SMTP port (use 465 for secure connection)
      secure: false,           // Use false for port 587
      auth: {
        user: process.env.SMTP_USER, // Your Mailgun SMTP username
        pass: process.env.SMTP_API_KEY, // Your Mailgun SMTP password
      },
    });

    return await transporter.sendMail({
     from : process.env.FROM_EMAIL,
      ... emailOptions
    });

  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw error; // Re-throw the error for the calling function to handle
  }
};




/**
 * Generates an email body using a Handlebars template.
 * @param {string} templateName - Name of the template file (without .hbs)
 * @param {Object} data - User details to inject into the template
 * @returns {string} - The compiled HTML email content
 */
export const createEmailBody = (templateName, data) => {
    try {
        // Resolve template file path
        const templatePath = path.join(TEMPLATE_DIR, `${templateName}.hbs`);

        // Read the Handlebars template file
        const templateSource = fs.readFileSync(templatePath, "utf8");

        // Compile the template
        const template = handlebars.compile(templateSource);

        // Generate final email content with injected data
        return template(data);
    } catch (error) {
        console.error("Error generating email body:", error);
        throw new Error("Failed to generate email content");
    }
};

