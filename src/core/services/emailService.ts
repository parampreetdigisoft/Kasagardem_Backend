import nodemailer, { Transporter } from "nodemailer";
import config from "../config/env";
import { passwordResetEmailTemplate } from "../../templates/passwordResetEmail";
import {
  leadSuccessEmailTemplateForAdmin,
  leadSuccessEmailTemplateForPartner,
  leadSuccessEmailTemplateForUser,
} from "../../templates/leadsGeneratedEmail";

/**
 * Creates and configures an email transporter using Nodemailer.
 *
 * @returns {Transporter} A Nodemailer transporter instance configured with Gmail (or chosen service).
 */
export const createTransporter = (): Transporter => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // or your email service
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
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Password Reset - Your 6-Digit Code",
    html: passwordResetEmailTemplate(resetToken, userName),
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends emails related to a lead to the User, the Partner, and the Admin.
 *
 * This function sends customized emails to each recipient using the provided
 * user, partner, and optional lead information. Lead details like phone number,
 * message, service, lead ID, and timestamp can be included in the email content.
 *
 * @param {Object} userData - Information about the user receiving the email.
 * @param {string} userData.email - The user's email address.
 * @param {string} userData.name - The user's full name.
 *
 * @param {Object} partnerData - Information about the partner receiving the email.
 * @param {string} partnerData.email - The partner's email address.
 * @param {string} partnerData.name - The partner's full name.
 * @param {string} [partnerData.logoUrl] - Optional URL of the partner's logo.
 *
 * @param {string} adminEmail - Email address of the admin to receive notifications.
 *
 * @param {Object} [leadDetails] - Optional additional details about the lead.
 * @param {string} [leadDetails.phone] - Lead's phone number.
 * @param {string} [leadDetails.message] - Message provided by the lead.
 * @param {string} [leadDetails.service] - Service the lead is interested in.
 * @param {string} [leadDetails.leadId] - Unique identifier for the lead.
 * @param {string} [leadDetails.timestamp] - Timestamp of when the lead was created.
 *
 * @param partnersData
 * @returns {Promise<void>} - A promise that resolves once all emails have been sent.
 *
 */
export const sendLeadEmails = async (
  userData: {
    email: string;
    name: string;
  },
  partnersData: Array<{
    email: string;
    name: string;
    logoUrl?: string;
  }>,
  adminEmail: string,
  leadDetails?: {
    phone?: string;
    message?: string;
    service?: string;
    leadId?: string;
    timestamp?: string;
  }
): Promise<void> => {
  const transporter = createTransporter();

  // 1. Send email to USER (with all partners info)
  const userMailOptions = {
    from: process.env.EMAIL_FROM,
    to: userData.email,
    subject: `Quote Request Confirmation - ${partnersData.length} Partner${partnersData.length > 1 ? "s" : ""} | Kasagardem`,
    html: leadSuccessEmailTemplateForUser(
      partnersData, // Pass full array of partners
      userData.name
    ),
  };

  // 2. Send email to each PARTNER individually
  const partnerMailPromises = partnersData.map((partner) => {
    const partnerMailOptions = {
      from: process.env.EMAIL_FROM,
      to: partner.email,
      subject: `New Lead Alert - ${userData.name} | Kasagardem`,
      html: leadSuccessEmailTemplateForPartner(
        partner.name,
        userData.name,
        userData.email,
        leadDetails
      ),
    };
    return transporter.sendMail(partnerMailOptions);
  });

  // 3. Send email to ADMIN (with all partners info)
  const adminMailOptions = {
    from: process.env.EMAIL_FROM,
    to: adminEmail,
    subject: `New Lead Generated - ${partnersData.length} Partner${partnersData.length > 1 ? "s" : ""} → ${userData.name}`,
    html: leadSuccessEmailTemplateForAdmin(
      partnersData, // Pass full array of partners with name and email
      userData.name,
      userData.email,
      leadDetails
    ),
  };

  // Send all emails in parallel
  await Promise.all([
    transporter.sendMail(userMailOptions),
    ...partnerMailPromises,
    transporter.sendMail(adminMailOptions),
  ]);
};
