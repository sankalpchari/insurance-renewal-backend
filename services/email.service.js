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
const sendMailgunEmail = async ({ to, subject, text, html }) => {
  try {
    // Create a nodemailer transporter with Mailgun SMTP credentials
    const transporter = nodemailer.createTransport({
      host: "smtp.mailgun.org", // Mailgun's SMTP server
      port: 587,               // Default SMTP port (use 465 for secure connection)
      secure: false,           // Use false for port 587
      auth: {
        user: process.env.MAILGUN_SMTP_USER, // Your Mailgun SMTP username
        pass: process.env.MAILGUN_SMTP_PASS, // Your Mailgun SMTP password
      },
    });

    // Send the email
    const mailOptions = {
      from: '"Your Name" <your_email@example.com>', // Sender's email
      to,                                           // Recipient's email
      subject,                                      // Email subject
      text,                                         // Plain text content
      html,                                         // HTML content (optional)
    };

    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw error; // Re-throw the error for the calling function to handle
  }
};

// Example usage
(async () => {
  try {
    await sendMailgunEmail({
      to: "recipient@example.com",
      subject: "Test Email from Mailgun",
      text: "This is a test email sent using Mailgun SMTP.",
      html: "<p>This is a test email sent using <strong>Mailgun SMTP</strong>.</p>",
    });
  } catch (error) {
    console.error("Error while sending email:", error.message);
  }
})();
