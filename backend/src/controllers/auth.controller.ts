import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { hashPassword, verifyPassword, generateOtp, hashOtp } from '../utils/crypto';
import { sendOtpEmail } from '../config/mailer';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      res.status(409).json({ success: false, message: 'User already exists and is verified. Please log in.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = existingUser
      ? await prisma.user.update({
          where: { email },
          data: { passwordHash },
        })
      : await prisma.user.create({
          data: { email, passwordHash },
        });

    const plainOtp = generateOtp();
    const codeHash = hashOtp(plainOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate all previous un-used OTPs for this user
    await prisma.emailOtp.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });   

    await prisma.emailOtp.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
        attemptCount: 0,
      },
    });

    try {
      await sendOtpEmail(email, plainOtp);
    } catch (emailError) {
      await prisma.emailOtp.deleteMany({ where: { userId: user.id } });
      if (!existingUser) {
        await prisma.user.delete({ where: { id: user.id } });
      }
      res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Verification code sent to email.',
      email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ 
        where: { email },
        include: { profile: true } 
      });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const latestOtp = await prisma.emailOtp.findFirst({
      where: { userId: user.id, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestOtp) {
      res.status(400).json({ success: false, message: 'No active OTP found. Please request a new one.' });
      return;
    }

    if (new Date() > latestOtp.expiresAt) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
      return;
    }

    if (latestOtp.attemptCount >= 5) {
      res.status(429).json({ success: false, message: 'Maximum attempts exceeded. Please request a new OTP.' });
      return;
    }

    const inputHash = hashOtp(otp);
    if (inputHash !== latestOtp.codeHash) {
      await prisma.emailOtp.update({
        where: { id: latestOtp.id },
        data: { attemptCount: { increment: 1 } },
      });
      const remainingAttempts = 4 - latestOtp.attemptCount;
      res.status(400).json({
        success: false,
        message: `Incorrect code. ${remainingAttempts > 0 ? remainingAttempts + ' attempts remaining.' : 'OTP locked.'}`,
      });
      return;
    }

    const verificationSucceeded = await prisma.$transaction(async (transaction) => {
      const markedOtp = await transaction.emailOtp.updateMany({
        where: { id: latestOtp.id, isUsed: false },
        data: { isUsed: true },
      });

      if (markedOtp.count !== 1) {
        return false;
      }

      await transaction.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });

      return true;
    });

    if (!verificationSucceeded) {
      res.status(400).json({ success: false, message: 'OTP has already been used. Please request a new code.' });
      return;
    }

    if (!process.env.JWT_SECRET) throw new Error("FATAL: JWT_SECRET is not defined.");

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: { 
        id: user.id, 
        email: user.email,
        hasProfile: Boolean(user.profile) 
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification error' });
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const latestOtp = await prisma.emailOtp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const timeSinceLastSent = (Date.now() - new Date(latestOtp.lastSentAt).getTime()) / 1000;
      if (timeSinceLastSent < 30) {
        const cooldownRemaining = Math.ceil(30 - timeSinceLastSent);
        res.status(429).json({
          success: false,
          message: `Please wait ${cooldownRemaining} seconds before requesting a new code.`,
          cooldownRemaining,
        });
        return;
      }
    }

    const plainOtp = generateOtp();
    const codeHash = hashOtp(plainOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const previousActiveOtps = await prisma.emailOtp.findMany({
      where: { userId: user.id, isUsed: false },
      select: { id: true },
    });

    const newOtp = await prisma.$transaction(async (transaction) => {
      await transaction.emailOtp.updateMany({
        where: { userId: user.id, isUsed: false },
        data: { isUsed: true },
      });

      return transaction.emailOtp.create({
        data: {
          userId: user.id,
          codeHash,
          expiresAt,
          attemptCount: 0,
        },
      });
    });

    try {
      await sendOtpEmail(email, plainOtp);
    } catch (emailError) {
      await prisma.$transaction([
        prisma.emailOtp.delete({ where: { id: newOtp.id } }),
        prisma.emailOtp.updateMany({
          where: { id: { in: previousActiveOtps.map((otpRecord) => otpRecord.id) } },
          data: { isUsed: false },
        }),
      ]);
      res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again.' });
      return;
    }

    res.status(200).json({ success: true, message: 'New verification code sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resend code' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        requiresVerification: true,
        message: 'Account not verified. Please verify your email.',
        email: user.email,
      });
      return;
    }

    if (!process.env.JWT_SECRET) throw new Error("FATAL: JWT_SECRET is not defined.");

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        hasProfile: Boolean(user.profile),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};