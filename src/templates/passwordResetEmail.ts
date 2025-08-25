/**
 * Generates the HTML template for the password reset email.
 *
 * @param {string} resetToken - The unique token used for resetting the user's password.
 * @param {string} userName - The name of the user to personalize the email greeting.
 * @returns {string} The HTML string containing the formatted password reset email.
 */
export const passwordResetEmailTemplate = (
  resetToken: string,
  userName: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f5fdf7; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 40px; color: #43a047; margin-bottom: 10px;">🌿</div>
        <h1 style="font-size: 24px; color: #2e7d32; margin: 0;">Kasagardem</h1>
        <p style="color: #4caf50; font-size: 14px; margin: 5px 0;">Secure & Green Password Reset</p>
      </div>

      <!-- Greeting -->
      <div style="background: #ffffff; border-radius: 12px; padding: 25px; margin-bottom: 20px; border: 1px solid #e0f2e9;">
        <h2 style="font-size: 20px; color: #2e7d32; margin-bottom: 10px; text-align: center;">Password Reset Request</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6; text-align: center;">
          Hi <strong>${userName}</strong>, we received a request to reset your password.
        </p>

        <!-- Reset Token -->
        <div style="margin: 20px 0; background: #f0fdf4; border: 1px dashed #43a047; padding: 25px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔑</div>
          <h3 style="color: #2e7d32; font-size: 16px; margin-bottom: 10px;">Your Reset Code</h3>
          <p style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #43a047; margin: 0;">
            ${resetToken}
          </p>
          <p style="color: #777; font-size: 13px; margin-top: 12px;">Enter this code to verify your password reset request</p>
        </div>

        <!-- Expiry -->
        <p style="text-align: center; font-size: 14px; color: #2e7d32; margin: 20px 0 0;">
          ⏳ <strong>This code will expire in 5 minutes.</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 20px; font-size: 13px; color: #666;">
        <div style="font-size: 24px; margin-bottom: 10px;">🌱🌿🍃</div>
        <p>If you didn’t request this, you can safely ignore this email.<br>Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #c8e6c9; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Need help? <a href="#" style="color: #388e3c; text-decoration: none;">Contact Support</a></p>
      </div>
    </div>
  `;
};
