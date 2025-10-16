/**
 * Generates the email content for the user confirming their quote request.
 *
 * This template is used to notify the user that their request has been successfully
 * submitted to multiple partners.
 *
 * @param {Array<{name: string, logoUrl?: string}>} partners - Array of partner objects with name and optional logo.
 * @param {string} userName - The name of the user receiving the email.
 *
 * @returns {string} - The HTML content of the email to send to the user.
 *
 */
export const leadSuccessEmailTemplateForUser = (
  partners: Array<{ name: string; logoUrl?: string }>,
  userName: string
): string => {
  const partnerCount = partners.length;
  const partnerNames = partners.map((p) => p.name).join(", ");

  // Generate partner logos section
  const partnerLogosHtml = partners
    .filter((p) => p.logoUrl)
    .map(
      (partner) => `
    <div style="display: inline-block; margin: 12px 18px; vertical-align: top;">
      <div style="background: #ffffff; padding: 15px; border-radius: 12px; box-shadow: 0 3px 15px rgba(46, 125, 50, 0.12); border: 2px solid #e8f5e9; transition: transform 0.3s ease;">
        <img src="${partner.logoUrl}" alt="${partner.name} Logo" style="max-width: 110px; height: auto; border-radius: 6px; display: block;" />
      </div>
      <p style="text-align: center; color: #2e7d32; font-size: 13px; margin: 10px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 600;">${partner.name}</p>
    </div>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lead Confirmation - Kasagardem</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 50%, #f1f8f4 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px rgba(46, 125, 50, 0.15); overflow: hidden; border: 3px solid #c8e6c9;">
              
              <!-- Decorative Top Border with Leaves -->
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
                  
                  <div style="font-size: 56px; margin-bottom: 15px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🌿</div>
                  <h1 style="font-size: 36px; color: #ffffff; margin: 0 0 10px 0; font-family: 'Georgia', 'Times New Roman', serif; font-weight: normal; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Kasagardem</h1>
                  <div style="width: 60px; height: 2px; background: rgba(255,255,255,0.5); margin: 12px auto;"></div>
                  <p style="color: #e8f5e9; font-size: 15px; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; letter-spacing: 1px; text-transform: uppercase; font-weight: 300;">Your Quote Request Confirmed</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 45px 35px; background: linear-gradient(180deg, #ffffff 0%, #f9fdf9 100%);">
                  
                  <!-- Success Badge with Botanical Frame -->
                  <div style="text-align: center; margin-bottom: 35px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 50%; padding: 25px; box-shadow: 0 6px 20px rgba(67, 160, 71, 0.25); border: 3px solid #81c784; position: relative;">
                      <div style="font-size: 64px; line-height: 1;">✓</div>
                    </div>
                    <h2 style="font-size: 26px; color: #1b5e20; margin: 25px 0 8px 0; font-family: 'Georgia', 'Times New Roman', serif; font-weight: normal;">Request Successfully Received</h2>
                    <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #81c784, transparent); margin: 15px auto;"></div>
                  </div>

                  <!-- Partner Logos with Botanical Border -->
                  ${
                    partnerLogosHtml
                      ? `
                  <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%); padding: 30px 20px; border-radius: 16px; box-shadow: inset 0 2px 8px rgba(46, 125, 50, 0.08); border: 2px dashed #a5d6a7; position: relative;">
                    <div style="position: absolute; top: -12px; left: 20px; background: #ffffff; padding: 0 15px; font-size: 24px;">🌱</div>
                    <div style="position: absolute; top: -12px; right: 20px; background: #ffffff; padding: 0 15px; font-size: 24px;">🌱</div>
                    <p style="color: #2e7d32; font-size: 13px; font-weight: bold; margin: 0 0 20px 0; font-family: 'Segoe UI', Arial, sans-serif; letter-spacing: 1.5px; text-transform: uppercase;">Your Request Sent To</p>
                    ${partnerLogosHtml}
                  </div>
                  `
                      : ""
                  }

                  <!-- Greeting with Leaf Accent -->
                  <div style="background: #ffffff; border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.1); border-left: 5px solid #66bb6a; position: relative;">
                    <div style="position: absolute; top: -15px; right: 25px; font-size: 36px; opacity: 0.15; transform: rotate(25deg);">🌿</div>
                    <p style="color: #1b5e20; font-size: 16px; line-height: 1.8; margin: 0 0 18px 0; font-family: 'Segoe UI', Arial, sans-serif;">
                      Dear <strong style="color: #2e7d32; font-weight: 600;">${userName}</strong>,
                    </p>
                    <p style="color: #424242; font-size: 15px; line-height: 1.9; margin: 0 0 18px 0; font-family: 'Segoe UI', Arial, sans-serif;">
                      Thank you for choosing Kasagardem! We're delighted to inform you that your quote request has been successfully received and forwarded to <strong style="color: #43a047; font-weight: 600;">${partnerCount} trusted partner${
                        partnerCount > 1 ? "s" : ""
                      }</strong>: <span style="color: #2e7d32; font-weight: 500;">${partnerNames}</span>.
                    </p>
                    <p style="color: #424242; font-size: 15px; line-height: 1.9; margin: 0; font-family: 'Segoe UI', Arial, sans-serif;">
                      Our team is carefully reviewing your requirements and will respond shortly with ${
                        partnerCount > 1
                          ? "tailored quotes"
                          : "a tailored quote"
                      } designed specifically for your gardening needs.
                    </p>
                  </div>

                  <!-- What's Next with Plant Growth Theme -->
                  <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 2px solid #a5d6a7; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.08);">
                    <h3 style="font-size: 20px; color: #1b5e20; margin: 0 0 25px 0; font-family: 'Georgia', 'Times New Roman', serif; text-align: center; font-weight: normal;">
                      <span style="font-size: 32px; display: block; margin-bottom: 10px;">🌱</span>
                      What Happens Next?
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 15px 0;">
                          <div style="display: inline-block; width: 40px; height: 40px; background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 40px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; vertical-align: middle; margin-right: 15px; box-shadow: 0 3px 10px rgba(67, 160, 71, 0.3);">1</div>
                          <span style="color: #2e7d32; font-size: 15px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">Our team carefully reviews your requirements</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0;">
                          <div style="display: inline-block; width: 40px; height: 40px; background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 40px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; vertical-align: middle; margin-right: 15px; box-shadow: 0 3px 10px rgba(67, 160, 71, 0.3);">2</div>
                          <span style="color: #2e7d32; font-size: 15px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">${
                            partnerCount > 1 ? "Partners" : "Partner"
                          } prepare${partnerCount === 1 ? "s" : ""} personalized quote${
                            partnerCount > 1 ? "s" : ""
                          } for you</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0;">
                          <div style="display: inline-block; width: 40px; height: 40px; background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 40px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; vertical-align: middle; margin-right: 15px; box-shadow: 0 3px 10px rgba(67, 160, 71, 0.3);">3</div>
                          <span style="color: #2e7d32; font-size: 15px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">You'll receive our response within 24-48 hours</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA with Leaf Accents -->
                  <div style="text-align: center; margin: 35px 0; position: relative;">
                    <div style="position: absolute; left: 50%; transform: translateX(-50%) translateY(-20px); font-size: 20px; opacity: 0.3;">🍃</div>
                    <a href="https://kasagardem.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 35px; font-size: 16px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 6px 20px rgba(67, 160, 71, 0.35); letter-spacing: 0.5px; border: 2px solid rgba(255,255,255,0.2);">
                      🌿 View Your Dashboard
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
                    If you have any questions or didn't request this quote,<br>please contact us immediately.
                  </p>
                  <div style="width: 100px; height: 2px; background: linear-gradient(90deg, transparent, #81c784, transparent); margin: 20px auto;"></div>
                  <p style="color: #616161; font-size: 13px; margin: 15px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif;">
                    Need assistance? 
                    <a href="mailto:support@kasagardem.com" style="color: #2e7d32; text-decoration: none; font-weight: bold; border-bottom: 2px solid #81c784;">Contact Support</a>
                  </p>
                  <p style="color: #9e9e9e; font-size: 12px; margin: 20px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-style: italic;">
                    Growing together, naturally 🌿
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

/**
 * Generates the email content for the partner notifying them of a new lead.
 *
 * This template remains the same as it's sent individually to each partner.
 *
 * @param {string} partnerName - The name of the partner receiving the email.
 * @param {string} userName - The name of the user who submitted the lead.
 * @param {string} userEmail - The email of the user who submitted the lead.
 * @param {Object} [leadDetails] - Optional details about the lead.
 * @param {string} [leadDetails.phone] - The phone number of the lead.
 * @param {string} [leadDetails.message] - The message provided by the lead.
 * @param {string} [leadDetails.service] - The service the lead is interested in.
 *
 * @returns {string} - The HTML content of the email to send to the partner.
 *
 */
export const leadSuccessEmailTemplateForPartner = (
  partnerName: string,
  userName: string,
  userEmail: string,
  leadDetails?: {
    phone?: string;
    message?: string;
    service?: string;
  }
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Lead - Kasagardem</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 50%, #f1f8f4 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px rgba(46, 125, 50, 0.15); overflow: hidden; border: 3px solid #c8e6c9;">
              
              <!-- Decorative Top Border with Leaves -->
              <tr>
                <td style="background: linear-gradient(135deg, #558b2f 0%, #689f38 50%, #7cb342 100%); height: 8px; position: relative;">
                </td>
              </tr>

              <!-- Header with Botanical Elements -->
              <tr>
                <td style="background: linear-gradient(135deg, #558b2f 0%, #689f38 100%); padding: 45px 30px 40px; text-align: center; position: relative;">
                  <!-- Leaf decorations -->
                  <div style="position: absolute; top: 20px; left: 20px; font-size: 40px; opacity: 0.3;">🌿</div>
                  <div style="position: absolute; top: 20px; right: 20px; font-size: 40px; opacity: 0.3;">🌿</div>
                  <div style="position: absolute; bottom: 15px; left: 40px; font-size: 28px; opacity: 0.25;">🌱</div>
                  <div style="position: absolute; bottom: 15px; right: 40px; font-size: 28px; opacity: 0.25;">🌱</div>
                  
                  <div style="font-size: 56px; margin-bottom: 15px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🌱</div>
                  <h1 style="font-size: 36px; color: #ffffff; margin: 0 0 10px 0; font-family: 'Georgia', 'Times New Roman', serif; font-weight: normal; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">New Lead Growing!</h1>
                  <div style="width: 60px; height: 2px; background: rgba(255,255,255,0.5); margin: 12px auto;"></div>
                  <p style="color: #e8f5e9; font-size: 15px; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; letter-spacing: 1px; text-transform: uppercase; font-weight: 300;">A New Opportunity Awaits</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 45px 35px; background: linear-gradient(180deg, #ffffff 0%, #f9fdf9 100%);">
                  
                  <!-- Partner Greeting with Botanical Frame -->
                  <div style="background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.1); border-left: 5px solid #7cb342; position: relative;">
                    <div style="position: absolute; top: -15px; right: 25px; font-size: 36px; opacity: 0.15; transform: rotate(25deg);">🌿</div>
                    <h2 style="font-size: 24px; color: #33691e; margin: 0 0 18px 0; font-family: 'Georgia', 'Times New Roman', serif; font-weight: normal;">
                      <span style="font-size: 28px; margin-right: 8px;">👋</span> Hello, <strong style="color: #558b2f; font-weight: 600;">${partnerName}</strong>
                    </h2>
                    <p style="color: #424242; font-size: 15px; line-height: 1.9; margin: 0; font-family: 'Segoe UI', Arial, sans-serif;">
                      Wonderful news! A fresh lead has sprouted through your partnership with Kasagardem. This is an excellent opportunity to grow your business. Here are the details:
                    </p>
                  </div>

                  <!-- Lead Information Card with Plant Theme -->
                  <div style="background: #ffffff; border-radius: 16px; padding: 35px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.1); border: 2px solid #c8e6c9;">
                    <h3 style="font-size: 20px; color: #33691e; margin: 0 0 25px 0; font-family: 'Georgia', 'Times New Roman', serif; text-align: center; border-bottom: 2px solid #a5d6a7; padding-bottom: 18px; font-weight: normal;">
                      <span style="font-size: 28px; display: block; margin-bottom: 8px;">📋</span>
                      Lead Details
                    </h3>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 2px solid #f1f8f4;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%); border-radius: 50%; text-align: center; line-height: 36px; font-size: 18px; margin-right: 12px; vertical-align: middle; box-shadow: 0 2px 8px rgba(129, 199, 132, 0.3);">👤</div>
                          <div style="display: inline-block; vertical-align: middle;">
                            <strong style="color: #558b2f; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Customer Name</strong>
                            <span style="color: #1b5e20; font-family: 'Segoe UI', Arial, sans-serif; font-size: 17px; font-weight: 600;">${userName}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 2px solid #f1f8f4;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%); border-radius: 50%; text-align: center; line-height: 36px; font-size: 18px; margin-right: 12px; vertical-align: middle; box-shadow: 0 2px 8px rgba(129, 199, 132, 0.3);">📧</div>
                          <div style="display: inline-block; vertical-align: middle;">
                            <strong style="color: #558b2f; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Email Address</strong>
                            <a href="mailto:${userEmail}" style="color: #2e7d32; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; text-decoration: none; border-bottom: 2px solid #81c784; font-weight: 500;">${userEmail}</a>
                          </div>
                        </td>
                      </tr>
                      ${
                        leadDetails?.phone
                          ? `
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 2px solid #f1f8f4;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%); border-radius: 50%; text-align: center; line-height: 36px; font-size: 18px; margin-right: 12px; vertical-align: middle; box-shadow: 0 2px 8px rgba(129, 199, 132, 0.3);">📱</div>
                          <div style="display: inline-block; vertical-align: middle;">
                            <strong style="color: #558b2f; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Phone Number</strong>
                            <a href="tel:${leadDetails.phone}" style="color: #2e7d32; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; text-decoration: none; border-bottom: 2px solid #81c784; font-weight: 500;">${leadDetails.phone}</a>
                          </div>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        leadDetails?.service
                          ? `
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 2px solid #f1f8f4;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%); border-radius: 50%; text-align: center; line-height: 36px; font-size: 18px; margin-right: 12px; vertical-align: middle; box-shadow: 0 2px 8px rgba(129, 199, 132, 0.3);">🛠️</div>
                          <div style="display: inline-block; vertical-align: middle;">
                            <strong style="color: #558b2f; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Service Requested</strong>
                            <span style="color: #1b5e20; font-family: 'Segoe UI', Arial, sans-serif; font-size: 17px; font-weight: 600;">${leadDetails.service}</span>
                          </div>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        leadDetails?.message
                          ? `
                      <tr>
                        <td style="padding: 18px 0;">
                          <div style="margin-bottom: 12px;">
                            <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%); border-radius: 50%; text-align: center; line-height: 36px; font-size: 18px; margin-right: 12px; vertical-align: middle; box-shadow: 0 2px 8px rgba(129, 199, 132, 0.3);">💬</div>
                            <strong style="color: #558b2f; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">Customer Message</strong>
                          </div>
                          <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%); padding: 20px; border-radius: 12px; color: #424242; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; line-height: 1.7; border-left: 4px solid #81c784; box-shadow: inset 0 2px 8px rgba(46, 125, 50, 0.05);">
                            ${leadDetails.message}
                          </div>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                  </div>

                  <!-- Action Items with Growth Theme -->
                  <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 2px solid #a5d6a7; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.08); position: relative;">
                    <div style="position: absolute; top: 15px; right: 15px; font-size: 48px; opacity: 0.1; transform: rotate(-15deg);">🌿</div>
                    <h3 style="font-size: 20px; color: #33691e; margin: 0 0 20px 0; font-family: 'Georgia', 'Times New Roman', serif; text-align: center; font-weight: normal;">
                      <span style="font-size: 32px; display: block; margin-bottom: 10px;">⚡</span>
                      Next Steps to Grow This Lead
                    </h3>
                    <p style="color: #424242; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0; font-family: 'Segoe UI', Arial, sans-serif; text-align: center;">
                      Our team will nurture this lead and reach out to the customer with personalized care. You'll be kept updated throughout the entire growth process.
                    </p>
                    <div style="background: #ffffff; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(46, 125, 50, 0.1); border: 2px solid #c8e6c9;">
                      <span style="font-size: 32px; display: block; margin-bottom: 10px;">🤝</span>
                      <strong style="color: #2e7d32; font-size: 17px; font-family: 'Segoe UI', Arial, sans-serif; display: block; margin-bottom: 5px;">Thank you for this partnership!</strong>
                      <span style="color: #689f38; font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; font-style: italic;">Together, we grow stronger 🌱</span>
                    </div>
                  </div>

                  <!-- CTA with Leaf Accents -->
                  <div style="text-align: center; margin: 35px 0; position: relative;">
                    <div style="position: absolute; left: 50%; transform: translateX(-50%) translateY(-20px); font-size: 20px; opacity: 0.3;">🍃</div>
                    <a href="https://kasagardem.com/partner/dashboard" style="display: inline-block; background: linear-gradient(135deg, #689f38 0%, #558b2f 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 35px; font-size: 16px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 6px 20px rgba(104, 159, 56, 0.35); letter-spacing: 0.5px; border: 2px solid rgba(255,255,255,0.2);">
                      🌿 View Partner Dashboard
                    </a>
                    <div style="position: absolute; left: 50%; transform: translateX(-50%) translateY(20px); font-size: 20px; opacity: 0.3;">🍃</div>
                  </div>

                </td>
              </tr>

              <!-- Footer with Botanical Elements -->
              <tr>
                <td style="background: linear-gradient(180deg, #f1f8f4 0%, #e8f5e9 100%); padding: 35px 30px; text-align: center; border-top: 3px solid #c8e6c9; position: relative;">
                  <div style="font-size: 36px; margin-bottom: 18px; letter-spacing: 8px;">🤝 🌱 🌿</div>
                  <p style="color: #424242; font-size: 14px; line-height: 1.7; margin: 0 0 18px 0; font-family: 'Segoe UI', Arial, sans-serif;">
                    Questions about this lead or our partnership?<br>We're here to help you grow!
                  </p>
                  <div style="width: 100px; height: 2px; background: linear-gradient(90deg, transparent, #81c784, transparent); margin: 20px auto;"></div>
                  <p style="color: #616161; font-size: 13px; margin: 15px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif;">
                    Need assistance? 
                    <a href="mailto:partners@kasagardem.com" style="color: #2e7d32; text-decoration: none; font-weight: bold; border-bottom: 2px solid #81c784;">Contact Partner Support</a>
                  </p>
                  <p style="color: #9e9e9e; font-size: 12px; margin: 20px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-style: italic;">
                    Cultivating success together 🌿
                  </p>
                </td>
              </tr>

              <!-- Decorative Bottom Border -->
              <tr>
                <td style="background: linear-gradient(135deg, #558b2f 0%, #689f38 50%, #7cb342 100%); height: 8px;">
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

/**
 * Generates the email content for the admin notifying them of a new lead.
 *
 * This template is updated to handle multiple partners.
 *
 * @param {Array<{name: string, email: string}>} partners - Array of partner objects with name and email.
 * @param {string} userName - The name of the user who submitted the lead.
 * @param {string} userEmail - The email of the user who submitted the lead.
 * @param {Object} [leadDetails] - Optional additional details about the lead.
 * @param {string} [leadDetails.phone] - The phone number of the lead.
 * @param {string} [leadDetails.message] - The message provided by the lead.
 * @param {string} [leadDetails.service] - The service the lead is interested in.
 * @param {string} [leadDetails.leadId] - Unique identifier for the lead.
 * @param {string} [leadDetails.timestamp] - Timestamp of when the lead was created.
 *
 * @returns {string} - The HTML content of the email to send to the admin.
 *
 */
export const leadSuccessEmailTemplateForAdmin = (
  partners: Array<{ name: string; email: string }>,
  userName: string,
  userEmail: string,
  leadDetails?: {
    phone?: string;
    message?: string;
    service?: string;
    leadId?: string;
    timestamp?: string;
  }
): string => {
  const partnerCount = partners.length;

  // Generate partner list HTML
  const partnersListHtml = partners
    .map(
      (partner, index) => `
    <tr>
      <td style="padding: 15px 18px; ${
        index < partners.length - 1 ? "border-bottom: 2px solid #e8f5e9;" : ""
      }">
        <div style="display: inline-block; width: 32px; height: 32px; background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%); border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; color: #ffffff; margin-right: 12px; vertical-align: middle; font-size: 14px; box-shadow: 0 2px 8px rgba(129, 199, 132, 0.3);">${
          index + 1
        }</div>
        <div style="display: inline-block; vertical-align: middle;">
          <strong style="color: #2e7d32; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; display: block; margin-bottom: 4px;">${
            partner.name
          }</strong>
          <a href="mailto:${
            partner.email
          }" style="color: #558b2f; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; text-decoration: none; border-bottom: 1px solid #a5d6a7;">${
            partner.email
          }</a>
        </div>
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Lead Alert - Admin</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 50%, #f1f8f4 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="650" cellpadding="0" cellspacing="0" style="max-width: 650px; background: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px rgba(46, 125, 50, 0.15); overflow: hidden; border: 3px solid #c8e6c9;">
              
              <!-- Decorative Top Border with Leaves -->
              <tr>
                <td style="background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%); height: 8px; position: relative;">
                </td>
              </tr>

              <!-- Header with Botanical Elements -->
              <tr>
                <td style="background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%); padding: 45px 30px 40px; text-align: center; position: relative;">
                  <!-- Leaf decorations -->
                  <div style="position: absolute; top: 20px; left: 20px; font-size: 40px; opacity: 0.25;">🌿</div>
                  <div style="position: absolute; top: 20px; right: 20px; font-size: 40px; opacity: 0.25;">🌿</div>
                  <div style="position: absolute; bottom: 15px; left: 40px; font-size: 28px; opacity: 0.2;">🍃</div>
                  <div style="position: absolute; bottom: 15px; right: 40px; font-size: 28px; opacity: 0.2;">🍃</div>
                  
                  <div style="font-size: 56px; margin-bottom: 15px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🌱</div>
                  <h1 style="font-size: 36px; color: #ffffff; margin: 0 0 10px 0; font-family: 'Georgia', 'Times New Roman', serif; font-weight: normal; letter-spacing: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">New Lead Sprouted</h1>
                  <div style="width: 60px; height: 2px; background: rgba(255,255,255,0.5); margin: 12px auto;"></div>
                  <p style="color: #e8f5e9; font-size: 15px; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; letter-spacing: 1px; text-transform: uppercase; font-weight: 300;">Admin Alert • ${partnerCount} Partner${
                    partnerCount > 1 ? "s" : ""
                  } Notified</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 45px 35px; background: linear-gradient(180deg, #ffffff 0%, #f9fdf9 100%);">
                  
                  <!-- Alert Badge with Botanical Frame -->
                  <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%); border-radius: 16px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.1); border: 2px solid #a5d6a7; text-align: center; position: relative;">
                    <div style="position: absolute; top: -15px; left: 25px; background: #ffffff; padding: 0 12px; font-size: 28px;">🌱</div>
                    <div style="position: absolute; top: -15px; right: 25px; background: #ffffff; padding: 0 12px; font-size: 28px;">🌱</div>
                    <div style="font-size: 42px; margin-bottom: 12px;">⚡</div>
                    <h2 style="font-size: 22px; color: #1b5e20; margin: 0 0 8px 0; font-family: 'Georgia', 'Times New Roman', serif; font-weight: normal;">
                      Immediate Attention Required
                    </h2>
                    <p style="color: #558b2f; font-size: 14px; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 600;">
                      ${leadDetails?.timestamp || new Date().toLocaleString()}
                    </p>
                  </div>

                  <!-- Lead Summary -->
                  <div style="background: #ffffff; border-radius: 16px; padding: 35px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.1); border: 2px solid #c8e6c9;">
                    <h3 style="font-size: 20px; color: #1b5e20; margin: 0 0 25px 0; font-family: 'Georgia', 'Times New Roman', serif; text-align: center; border-bottom: 2px solid #a5d6a7; padding-bottom: 18px; font-weight: normal;">
                      <span style="font-size: 28px; display: block; margin-bottom: 8px;">📊</span>
                      Lead Growth Report
                    </h3>
                    
                    ${
                      leadDetails?.leadId
                        ? `
                    <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; text-align: center; border: 2px dashed #a5d6a7;">
                      <strong style="color: #2e7d32; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; display: block; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Lead Identifier</strong>
                      <code style="background: #ffffff; padding: 12px 20px; border-radius: 8px; color: #1b5e20; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; box-shadow: 0 2px 8px rgba(46, 125, 50, 0.1); border: 2px solid #c8e6c9; display: inline-block;">${leadDetails.leadId}</code>
                    </div>
                    `
                        : ""
                    }
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; border: 2px solid #c8e6c9; border-radius: 12px; overflow: hidden;">
                      <tr>
                        <td colspan="2" style="background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); color: #ffffff; padding: 15px 20px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px;">
                          <span style="font-size: 20px; margin-right: 8px;">👥</span> Customer Information
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 20px; border-bottom: 2px solid #e8f5e9; width: 35%; background: #f9fdf9;">
                          <strong style="color: #2e7d32; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Name:</strong>
                        </td>
                        <td style="padding: 15px 20px; border-bottom: 2px solid #e8f5e9; background: #ffffff;">
                          <span style="color: #1b5e20; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600;">${userName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 20px; border-bottom: 2px solid #e8f5e9; background: #f9fdf9;">
                          <strong style="color: #2e7d32; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Email:</strong>
                        </td>
                        <td style="padding: 15px 20px; border-bottom: 2px solid #e8f5e9; background: #ffffff;">
                          <a href="mailto:${userEmail}" style="color: #388e3c; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; text-decoration: none; border-bottom: 2px solid #81c784; font-weight: 500;">${userEmail}</a>
                        </td>
                      </tr>
                      ${
                        leadDetails?.phone
                          ? `
                      <tr>
                        <td style="padding: 15px 20px; border-bottom: 2px solid #e8f5e9; background: #f9fdf9;">
                          <strong style="color: #2e7d32; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Phone:</strong>
                        </td>
                        <td style="padding: 15px 20px; border-bottom: 2px solid #e8f5e9; background: #ffffff;">
                          <a href="tel:${leadDetails.phone}" style="color: #388e3c; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; text-decoration: none; border-bottom: 2px solid #81c784; font-weight: 500;">${leadDetails.phone}</a>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        leadDetails?.service
                          ? `
                      <tr>
                        <td style="padding: 15px 20px; background: #f9fdf9;">
                          <strong style="color: #2e7d32; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Service:</strong>
                        </td>
                        <td style="padding: 15px 20px; background: #ffffff;">
                          <span style="color: #1b5e20; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px; font-weight: 600;">${leadDetails.service}</span>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #c8e6c9; border-radius: 12px; overflow: hidden;">
                      <tr>
                        <td colspan="2" style="background: linear-gradient(135deg, #558b2f 0%, #689f38 100%); color: #ffffff; padding: 15px 20px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; font-size: 16px;">
                          <span style="font-size: 20px; margin-right: 8px;">🤝</span> Partner Information (${partnerCount} Partner${
                            partnerCount > 1 ? "s" : ""
                          })
                        </td>
                      </tr>
                      ${partnersListHtml}
                    </table>

                    ${
                      leadDetails?.message
                        ? `
                    <div style="margin-top: 25px;">
                      <div style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%); padding: 5px 20px; border-radius: 8px 8px 0 0; border: 2px solid #c8e6c9; border-bottom: none;">
                        <strong style="color: #2e7d32; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                          <span style="font-size: 20px; margin-right: 8px; vertical-align: middle;">💬</span>
                          Customer Message
                        </strong>
                      </div>
                      <div style="background: #ffffff; padding: 25px; border-radius: 0 0 8px 8px; border: 2px solid #c8e6c9; border-top: none; box-shadow: inset 0 2px 8px rgba(46, 125, 50, 0.05);">
                        <p style="color: #424242; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; line-height: 1.8; margin: 0; white-space: pre-wrap;">${leadDetails.message}</p>
                      </div>
                    </div>
                    `
                        : ""
                    }
                  </div>

                  <!-- Action Required with Growth Steps -->
                  <div style="background: linear-gradient(135deg, #fff9e6 0%, #fff3d6 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 3px solid #ffcc80; box-shadow: 0 4px 15px rgba(255, 152, 0, 0.1); position: relative;">
                    <div style="position: absolute; top: 15px; right: 15px; font-size: 48px; opacity: 0.1; transform: rotate(-15deg);">🌿</div>
                    <h3 style="font-size: 20px; color: #e65100; margin: 0 0 20px 0; font-family: 'Georgia', 'Times New Roman', serif; text-align: center; font-weight: normal;">
                      <span style="font-size: 32px; display: block; margin-bottom: 10px;">⚠️</span>
                      Required Actions to Nurture This Lead
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; vertical-align: middle; margin-right: 12px; font-size: 16px; box-shadow: 0 3px 10px rgba(245, 124, 0, 0.3);">1</div>
                          <span style="color: #424242; font-size: 15px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">Review complete lead details and requirements</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; vertical-align: middle; margin-right: 12px; font-size: 16px; box-shadow: 0 3px 10px rgba(245, 124, 0, 0.3);">2</div>
                          <span style="color: #424242; font-size: 15px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">Assign to appropriate team member for cultivation</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; vertical-align: middle; margin-right: 12px; font-size: 16px; box-shadow: 0 3px 10px rgba(245, 124, 0, 0.3);">3</div>
                          <span style="color: #424242; font-size: 15px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">Initiate customer contact within 24 hours</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: inline-block; width: 36px; height: 36px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; vertical-align: middle; margin-right: 12px; font-size: 16px; box-shadow: 0 3px 10px rgba(245, 124, 0, 0.3);">4</div>
                          <span style="color: #424242; font-size: 15px; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">Update ${
                            partnerCount > 1 ? "partners" : "partner"
                          } on lead progression status</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA Buttons with Leaf Accents -->
                  <div style="text-align: center; margin: 35px 0; position: relative;">
                    <div style="position: absolute; left: 50%; transform: translateX(-50%) translateY(-20px); font-size: 20px; opacity: 0.3;">🍃</div>
                    <a href="https://kasagardem.com/admin/leads/${
                      leadDetails?.leadId || ""
                    }" style="display: inline-block; background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 6px 20px rgba(67, 160, 71, 0.35); margin: 0 8px 12px 8px; letter-spacing: 0.5px; border: 2px solid rgba(255,255,255,0.2);">
                      🌿 View in Admin Panel
                    </a>
                    <a href="mailto:${userEmail}" style="display: inline-block; background: linear-gradient(135deg, #689f38 0%, #558b2f 100%); color: #ffffff; text-decoration: none; padding: 18px 45px; border-radius: 35px; font-size: 16px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 6px 20px rgba(104, 159, 56, 0.35); margin: 0 8px 12px 8px; letter-spacing: 0.5px; border: 2px solid rgba(255,255,255,0.2);">
                      📧 Contact Customer
                    </a>
                    <div style="position: absolute; left: 50%; transform: translateX(-50%) translateY(20px); font-size: 20px; opacity: 0.3;">🍃</div>
                  </div>

                </td>
              </tr>

              <!-- Footer with Botanical Elements -->
              <tr>
                <td style="background: linear-gradient(180deg, #f1f8f4 0%, #e8f5e9 100%); padding: 35px 30px; text-align: center; border-top: 3px solid #c8e6c9; position: relative;">
                  <div style="font-size: 36px; margin-bottom: 18px; letter-spacing: 8px;">🔔 🌱 ⚡</div>
                  <p style="color: #424242; font-size: 14px; margin: 0 0 8px 0; font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500;">
                    Automated Admin Notification
                  </p>
                  <p style="color: #616161; font-size: 13px; margin: 0; font-family: 'Segoe UI', Arial, sans-serif;">
                    Kasagardem Lead Growth Management System
                  </p>
                  <div style="width: 100px; height: 2px; background: linear-gradient(90deg, transparent, #81c784, transparent); margin: 20px auto;"></div>
                  <p style="color: #9e9e9e; font-size: 12px; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-style: italic;">
                    © 2025 Kasagardem • Internal Use Only • Confidential
                  </p>
                  <p style="color: #9e9e9e; font-size: 11px; margin: 10px 0 0 0; font-family: 'Segoe UI', Arial, sans-serif; font-style: italic;">
                    Growing business, naturally 🌿
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
