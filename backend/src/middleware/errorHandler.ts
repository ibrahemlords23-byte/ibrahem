import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auditLog = (action: string, entityType: string) => {
  return async (req: any, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      if (req.user && res.statusCode < 400) {
        prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            entityType,
            entityId: req.params.id || 'unknown',
            metadata: {
              method: req.method,
              url: req.url,
              body: req.method !== 'GET' ? req.body : undefined,
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          },
        }).catch(console.error);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'بيانات غير صحيحة',
      errors: error.errors,
    });
  }

  if (error.code === 'P2002') {
    return res.status(409).json({
      message: 'هذا السجل موجود مسبقاً',
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      message: 'السجل غير موجود',
    });
  }

  res.status(500).json({
    message: 'حدث خطأ في الخادم',
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    message: 'المسار غير موجود',
  });
};
