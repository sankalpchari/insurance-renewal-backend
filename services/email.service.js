import nodemailer from "nodemailer";


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
