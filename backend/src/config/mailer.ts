import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // Default to Mailpit's local port if env vars are missing
  const host = process.env.SMTP_HOST || 'localhost';
  const port = Number(process.env.SMTP_PORT) || 1025;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    // Fail fast so a blocked SMTP port does not hold resources for long
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    ...(process.env.SMTP_USER && {
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || ''
      }
    }),
  });

  console.log(`✉️ Mailer initialized routing to ${host}:${port}`);
  return transporter;
};

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  try {
    const mailer = await getTransporter();
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"PadosiPro" <noreply@padosipro.com>',
      to: email,
      subject: 'Your PadosiPro Verification Code',
      text: `Your 6-digit verification code is: ${otp}.`,
      html: `<h2>Verify your email</h2><h1>${otp}</h1><p>Valid for 10 minutes.</p>`,
    });
    console.log(`\n📨 OTP Email dispatched for ${email}`);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Email delivery failed. Check SMTP settings or that Mailpit is running locally.');
  }
};