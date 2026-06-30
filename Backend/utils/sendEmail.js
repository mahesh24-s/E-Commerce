import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
})

export const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  const subjects = {
    verification: 'Verify Your Email — ShopEase',
    reset: 'Password Reset OTP — ShopEase',
  }

  const titles = {
    verification: 'Email Verification',
    reset: 'Password Reset',
  }

  const descriptions = {
    verification: 'Use the OTP below to verify your email address. It expires in 10 minutes.',
    reset: 'Use the OTP below to reset your password. It expires in 10 minutes.',
  }

  const mailOptions = {
    from: `"ShopEase" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjects[purpose] || subjects.verification,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0;">
          <div style="max-width: 480px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">🛒 ShopEase</h1>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937; margin-top: 0;">${titles[purpose]}</h2>
              <p style="color: #6b7280;">${descriptions[purpose]}</p>
              <div style="text-align: center; margin: 32px 0;">
                <span style="display: inline-block; background: #f3f4f6; border: 2px dashed #6366f1; border-radius: 12px; padding: 16px 40px; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #6366f1;">
                  ${otp}
                </span>
              </div>
              <p style="color: #9ca3af; font-size: 13px; text-align: center;">
                This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 ShopEase. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export const sendOrderConfirmationEmail = async (email, order) => {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
        </tr>`
    )
    .join('')

  const mailOptions = {
    from: `"ShopEase" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order Confirmed #${order._id} — ShopEase`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0;">
          <div style="max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">🛒 ShopEase</h1>
              <p style="color: #c7d2fe; margin: 8px 0 0;">Order Confirmed!</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #1f2937;">Thank you for your order!</h2>
              <p style="color: #6b7280;">Order ID: <strong>#${order._id}</strong></p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 8px; text-align: left;">Product</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>
              <div style="text-align: right; border-top: 2px solid #6366f1; padding-top: 12px;">
                <strong style="font-size: 18px; color: #6366f1;">Total: ₹${order.totalAmount.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
}
