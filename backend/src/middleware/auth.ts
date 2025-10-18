import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    isTrialActive: boolean;
    trialEndDate?: Date;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'رمز الوصول مطلوب' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        isTrialActive: true,
        trialEndDate: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'المستخدم غير موجود أو غير نشط' });
    }

    // Check trial status
    if (user.isTrialActive && user.trialEndDate && new Date() > user.trialEndDate) {
      return res.status(403).json({ 
        message: 'انتهت فترة التجربة',
        code: 'TRIAL_EXPIRED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'رمز الوصول غير صالح' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'غير مصرح بالوصول' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'ليس لديك صلاحية للوصول إلى هذا المورد' });
    }

    next();
  };
};

export const requireTrialActive = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'غير مصرح بالوصول' });
  }

  if (!req.user.isTrialActive) {
    return res.status(403).json({ 
      message: 'هذه الميزة متاحة فقط في النسخة التجريبية',
      code: 'TRIAL_REQUIRED'
    });
  }

  next();
};
