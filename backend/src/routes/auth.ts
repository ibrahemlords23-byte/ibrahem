import { Router } from 'express';
import { AuthController, UserController } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { authRateLimit } from '../middleware/security';
import { body } from 'express-validator';

const router = Router();
const authController = new AuthController();
const userController = new UserController();

// Auth routes
router.post('/login', 
  authRateLimit,
  [
    body('username').notEmpty().withMessage('اسم المستخدم مطلوب'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
  ],
  authController.login
);

router.post('/refresh', 
  [
    body('refreshToken').notEmpty().withMessage('رمز التحديث مطلوب'),
  ],
  authController.refreshToken
);

router.post('/logout', 
  authenticateToken,
  authController.logout
);

// User routes
router.get('/users',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  userController.getUsers
);

router.get('/users/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  userController.getUserById
);

router.post('/users',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  [
    body('username').notEmpty().withMessage('اسم المستخدم مطلوب'),
    body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('fullName').notEmpty().withMessage('الاسم الكامل مطلوب'),
    body('role').isIn(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER', 'USER']).withMessage('الدور غير صحيح'),
  ],
  userController.createUser
);

router.put('/users/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  [
    body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صحيح'),
    body('password').optional().isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('role').optional().isIn(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER', 'USER']).withMessage('الدور غير صحيح'),
  ],
  userController.updateUser
);

router.delete('/users/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  userController.deleteUser
);

router.get('/me',
  authenticateToken,
  userController.getCurrentUser
);

export default router;
