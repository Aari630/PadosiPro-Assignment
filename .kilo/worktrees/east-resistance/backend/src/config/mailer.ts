import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter: nodemailer.Transporter;

// Initialize Ethereal transporter
nodemailer.createTestAccount().then((account) => {
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
  console.log('✉️ Ethereal Email ready for testing');
});

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  if (!transporter) {
    console.error('Transporter not initialized yet.');
    return;
  }

  const info = await transporter.sendMail({
    from: '"PadosiPro" <noreply@padosipro.com>',
    to: email,
    subject: 'Your PadosiPro Verification Code',
    text: `Your 6-digit verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Verify your email</h2>
        <p>Use the 6-digit code below to complete your registration for PadosiPro:</p>
        <h1 style="letter-spacing: 5px; color: #1E40AF;">${otp}</h1>
        <p>This code is valid for 10 minutes and can only be used once.</p>
      </div>
    `,
  });

  console.log(`\n📨 OTP Email sent to ${email}`);
  console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
};