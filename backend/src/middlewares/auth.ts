import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET is not defined.");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.userId !== 'string' ||
      typeof decoded.email !== 'string'
    ) {
      res.status(403).json({ success: false, message: 'Invalid token payload' });
      return;
    }

    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  });
};