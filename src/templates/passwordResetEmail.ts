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
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Kasagardem</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 50%, #f1f8f4 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px rgba(46, 125, 50, 0.15); overflow: hidden; border: 3px solid #c8e6c9;">
              
              <!-- Decorative Top Border -->
              <tr>
                <td style="background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%); height: 8px; position: relative;">
                </td>
              </tr>

              <!-- Header with Botanical Elements -->
              <tr>
                <td style="background: linear-gradient(135deg, #2e7d32 0%, #43a047 100%); padding: 45px 30px 40px; text-align: center; position: relative;">
                  <!-- Leaf decorations -->
                  <div style="position: absolute; top: 20px; left: 20px; font-size: 40px; opacity: 0.3;">🌿</div>
                  <div style="position: absolute; top: 20px; right: 20px; font-size: 40px; opacity: 0.3;">🌿</div>
                  <div style="position: absolute; bottom: 15px; left: 40px; font-size: 28px; opacity: 0.25;">🍃</div>
                  <div style="position: absolute; bottom: 15px; right: 40px; font-size: 28px; opacity: 0.25;">🍃</div>
                  
                  <div style="font-size: 56px; margin-bottom: 15px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🔐</div>
                  <h1 style="font-size: 36px; color: #ffffff; margin: 0 0 10px 0; font-family: 'Georgia', 'Times New Roman', serif; font-weight: normal; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Kasagardem</h1>
                  <div style="width: 60px; height: 2px; background: rgba(255,255,255,0.5); margin: 12px auto;"></div>
                  <p style="color: #e8f5e9; font-size: 15px; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; letter-spacing: 1px; text-transform: uppercase; font-weight: 300;">Secure Password Reset</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 45px 35px; background: linear-gradient(180deg, #ffffff 0%, #f9fdf9 100%);">
                  
                  <!-- Security Badge with Botanical Frame -->
                  <div style="text-align: center; margin-bottom: 35px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 50%; padding: 25px; box-shadow: 0 6px 20px rgba(67, 160, 71, 0.25); border: 3px solid #81c784; position: relative;">
                      <div style="font-size: 64px; line-height: 1;">🔑</div>
                    </div>
                    <h2 style="font-size: 26px; color: #1b5e20; margin: 25px 0 8px 0; font-family: 'Georgia', 'Times New Roman', serif; font-weight: normal;">Password Reset Request</h2>
                    <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #81c784, transparent); margin: 15px auto;"></div>
                  </div>

                  <!-- Greeting with Leaf Accent -->
                  <div style="background: #ffffff; border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.1); border-left: 5px solid #66bb6a; position: relative;">
                    <div style="position: absolute; top: -15px; right: 25px; font-size: 36px; opacity: 0.15; transform: rotate(25deg);">🌿</div>
                    <p style="color: #1b5e20; font-size: 16px; line-height: 1.8; margin: 0 0 18px 0; font-family: 'Segoe UI', Arial, sans-serif;">
                      Dear <strong style="color: #2e7d32; font-weight: 600;">${userName}</strong>,
                    </p>
                    <p style="color: #424242; font-size: 15px; line-height: 1.9; margin: 0 0 18px 0; font-family: 'Segoe UI', Arial, sans-serif;">
                      We received a request to reset your password for your Kasagardem account. To proceed with the password reset, please use the verification code below.
                    </p>
                    <p style="color: #424242; font-size: 15px; line-height: 1.9; margin: 0; font-family: 'Segoe UI', Arial, sans-serif;">
                      If you didn't request this password reset, you can safely ignore this email. Your account remains secure.
                    </p>
                  </div>

                  <!-- Reset Token Box with Plant Growth Theme -->
                  <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%); border-radius: 16px; padding: 35px; margin-bottom: 30px; border: 2px dashed #a5d6a7; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.08); position: relative; text-align: center;">
                    <div style="position: absolute; top: -12px; left: 20px; background: #ffffff; padding: 0 15px; font-size: 24px;">🌱</div>
                    <div style="position: absolute; top: -12px; right: 20px; background: #ffffff; padding: 0 15px; font-size: 24px;">🌱</div>
                    
                    <p style="color: #2e7d32; font-size: 13px; font-weight: bold; margin: 0 0 20px 0; font-family: 'Segoe UI', Arial, sans-serif; letter-spacing: 1.5px; text-transform: uppercase;">Your Verification Code</p>
                    
                    <div style="background: #ffffff; padding: 25px; border-radius: 12px; box-shadow: 0 3px 15px rgba(46, 125, 50, 0.12); border: 2px solid #c8e6c9; margin-bottom: 20px;">
                      <p style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #2e7d32; margin: 0; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(46, 125, 50, 0.1);">
                        ${resetToken}
                      </p>
                    </div>
                    
                    <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; border-radius: 8px; margin-top: 20px;">
                      <p style="color: #e65100; font-size: 14px; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 600;">
                        ⏳ <strong>Time Sensitive:</strong> This code expires in 5 minutes
                      </p>
                    </div>
                  </div>

                  <!-- Security Information with Plant Growth Theme -->
                  <div style="background: linear-gradient(135deg, #e3f2fd 0%, #e1f5fe 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 2px solid #81d4fa; box-shadow: 0 4px 15px rgba(3, 169, 244, 0.08);">
                    <h3 style="font-size: 20px; color: #01579b; margin: 0 0 25px 0; font-family: 'Georgia', 'Times New Roman', serif; text-align: center; font-weight: normal;">
                      <span style="font-size: 32px; display: block; margin-bottom: 10px;">🛡️</span>
                      Security Tips
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; vertical-align: middle; margin-right: 15px; box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);">✓</div>
                          <span style="color: #01579b; font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">Never share your reset code with anyone</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; vertical-align: middle; margin-right: 15px; box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);">✓</div>
                          <span style="color: #01579b; font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">Kasagardem will never ask for your password via email</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; vertical-align: middle; margin-right: 15px; box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);">✓</div>
                          <span style="color: #01579b; font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">Use a strong, unique password for your account</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA with Leaf Accents -->
                  <div style="text-align: center; margin: 35px 0; position: relative;">
                    <div style="position: absolute; left: 50%; transform: translateX(-50%) translateY(-20px); font-size: 20px; opacity: 0.3;">🍃</div>
                    <a href="https://kasagardem.com/reset-password" style="display: inline-block; background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 35px; font-size: 16px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 6px 20px rgba(67, 160, 71, 0.35); letter-spacing: 0.5px; border: 2px solid rgba(255,255,255,0.2);">
                      🔐 Reset Your Password
                    </a>
                    <div style="position: absolute; left: 50%; transform: translateX(-50%) translateY(20px); font-size: 20px; opacity: 0.3;">🍃</div>
                  </div>

                </td>
              </tr>

              <!-- Footer with Botanical Elements -->
              <tr>
                <td style="background: linear-gradient(180deg, #f1f8f4 0%, #e8f5e9 100%); padding: 35px 30px; text-align: center; border-top: 3px solid #c8e6c9; position: relative;">
                  <div style="font-size: 36px; margin-bottom: 18px; letter-spacing: 8px;">🌱 🌿 🍃</div>
                  <p style="color: #424242; font-size: 14px; line-height: 1.7; margin: 0 0 18px 0; font-family: 'Segoe UI', Arial, sans-serif;">
                    If you didn't request this password reset,<br>please contact us immediately to secure your account.
                  </p>
                  <div style="width: 100px; height: 2px; background: linear-gradient(90deg, transparent, #81c784, transparent); margin: 20px auto;"></div>
                  <p style="color: #616161; font-size: 13px; margin: 15px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif;">
                    Need assistance? 
                    <a href="mailto:support@kasagardem.com" style="color: #2e7d32; text-decoration: none; font-weight: bold; border-bottom: 2px solid #81c784;">Contact Support</a>
                  </p>
                  <p style="color: #9e9e9e; font-size: 12px; margin: 20px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-style: italic;">
                    Growing together, securely 🌿
                  </p>
                </td>
              </tr>

              <!-- Decorative Bottom Border -->
              <tr>
                <td style="background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%); height: 8px;">
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
