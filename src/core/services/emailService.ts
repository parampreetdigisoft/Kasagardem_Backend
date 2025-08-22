import nodemailer, { Transporter } from "nodemailer";
import config from "../config/env";

/**
 * Creates and configures an email transporter using Nodemailer.
 *
 * @returns {Transporter} A Nodemailer transporter instance configured with Gmail (or chosen service).
 */
export const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    service: "gmail", // or your email service
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS, // Use app password for Gmail
    },
  });
};

/**
 * Sends a password reset email with a token to the user.
 *
 * @param email - The recipient's email address.
 * @param resetToken - The token used for password reset (6 digits).
 * @param userName - The name of the user receiving the email.
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@yourapp.com",
    to: email,
    subject: "Password Reset - Your 6-Digit Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
  
  <!-- Logo + Brand -->
  <div style="text-align: center; margin-bottom: 25px; display: flex; align-items: center; justify-content: center; gap: 8px;">
    <span style="font-size: 22px; font-weight: bold; color: #333; font-family: Arial, sans-serif;">Kasagardem</span>
  </div>

  <!-- Title -->
  <div style="text-align: center; margin-bottom: 25px;">
    <h1 style="color: #333; margin-bottom: 10px; font-size: 24px;">Password Reset</h1>
    <p style="color: #666; font-size: 16px;">Hi ${userName}, you requested to reset your password</p>
  </div>
  
  <!-- Reset Code Card -->
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; border: 1px solid #e0e0e0;">
    <h2 style="color: #333; margin-bottom: 15px; font-size: 20px;">Your Password Reset Code</h2>
    <div style="font-size: 36px; font-weight: bold; color: #dc3545; letter-spacing: 8px; margin: 20px 0;">
      ${resetToken}
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 15px;">
      Enter this code to verify your password reset request
    </p>
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; color: #666; font-size: 14px; line-height: 1.6;">
    <p><strong>This code will expire in 5 minutes.</strong></p>
    <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
    <p style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
      Need help? Contact our support team.
    </p>
  </div>
</div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
