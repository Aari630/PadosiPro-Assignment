import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../config/db';

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const profile = await prisma.profile.findUnique({ where: { userId } });

    res.status(200).json({
      success: true,
      profile: profile || null,
      hasProfile: Boolean(profile),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve profile', error });
  }
};

export const upsertProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { fullName, mobileNumber, address, businessName } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  try {
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        fullName,
        mobileNumber,
        address,
        businessName: businessName || null,
      },
      create: {
        userId,
        fullName,
        mobileNumber,
        address,
        businessName: businessName || null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile saved successfully',
      profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save profile', error });
  }
};