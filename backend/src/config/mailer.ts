import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter: nodemailer.Transporter | null = null;
let isEthereal = false;

const getTransporter = async () => {
  if (transporter) return transporter;
  
  // 1. Use configured SMTP if available (checking HOST instead of USER for Mailpit support)
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: false, // true for 465, false for other ports
      // Only include auth if a user is explicitly provided
      ...(process.env.SMTP_USER && {
        auth: { 
          user: process.env.SMTP_USER, 
          pass: process.env.SMTP_PASS || ''
        }
      }),
    });
    console.log(`✉️ Custom SMTP Email initialized via ${process.env.SMTP_HOST}`);
    return transporter;
  }

  // 2. Fallback to Ethereal for local testing without SMTP config
  const account = await nodemailer.createTestAccount();
  isEthereal = true;
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
  
  console.log('✉️ Ethereal Email initialized');
  return transporter;
};

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  try {
    const mailer = await getTransporter();
    
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"PadosiPro" <noreply@padosipro.com>',
      to: email,
      subject: 'Your PadosiPro Verification Code',
      text: `Your 6-digit verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2>Verify your email</h2>
              <h1 style="letter-spacing: 5px; color: #1E40AF;">${otp}</h1>
              <p>This code is valid for 10 minutes and can only be used once.</p>
            </div>`,
    });
    
    console.log(`\n📨 OTP Email sent to ${email}`);
    
    if (isEthereal) {
      console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
    }
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Email delivery failed');
  }
};