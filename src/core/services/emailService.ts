import nodemailer, { Transporter } from "nodemailer";
import config from "../config/env";
import { passwordResetEmailTemplate } from "../../templates/passwordResetEmail";

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
    html: passwordResetEmailTemplate(resetToken, userName),
  };

  await transporter.sendMail(mailOptions);
};
