import { Router } from 'express';
import { register, verifyOtp, resendOtp, login } from '../controllers/auth.controller';
import { getProfile, upsertProfile } from '../controllers/profile.controller';
import { getCatalog, selectTasks, getSelectedTasks } from '../controllers/task.controller';
import { validate } from '../middlewares/validate';
import { authenticateToken } from '../middlewares/auth';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  profileSchema,
  taskSelectionSchema,
} from '../validators/schemas';

const router = Router();

// Auth routes
router.post('/auth/register', validate(registerSchema), register);
router.post('/auth/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/auth/resend-otp', validate(resendOtpSchema), resendOtp);
router.post('/auth/login', validate(loginSchema), login);

// Profile routes (Protected)
router.get('/profile', authenticateToken, getProfile);
router.post('/profile', authenticateToken, validate(profileSchema), upsertProfile);

// Task routes (Protected)
router.get('/tasks/catalog', authenticateToken, getCatalog);
router.post('/tasks/select', authenticateToken, validate(taskSelectionSchema), selectTasks);
router.get('/tasks/selected', authenticateToken, getSelectedTasks);

export default router;