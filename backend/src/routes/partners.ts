import { Router } from 'express';
import { PartnerController } from '../controllers/partnerController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import { body } from 'express-validator';

const router = Router();
const partnerController = new PartnerController();

// Partners (General)
router.get('/',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  partnerController.getPartners
);

router.get('/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  partnerController.getPartnerById
);

router.post('/',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  [
    body('type').isIn(['CUSTOMER', 'VENDOR']).withMessage('نوع الشريك يجب أن يكون CUSTOMER أو VENDOR'),
    body('name').notEmpty().withMessage('اسم الشريك مطلوب'),
    body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  ],
  partnerController.createPartner
);

router.put('/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  [
    body('type').optional().isIn(['CUSTOMER', 'VENDOR']).withMessage('نوع الشريك يجب أن يكون CUSTOMER أو VENDOR'),
    body('name').optional().notEmpty().withMessage('اسم الشريك مطلوب'),
    body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  ],
  partnerController.updatePartner
);

router.delete('/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  partnerController.deletePartner
);

// Customers
router.get('/customers',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  partnerController.getCustomers
);

// Vendors
router.get('/vendors',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  partnerController.getVendors
);

// Statistics
router.get('/stats',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  partnerController.getPartnerStats
);

// Top Customers/Vendors
router.get('/top/customers',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  partnerController.getTopCustomers
);

router.get('/top/vendors',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  partnerController.getTopVendors
);

export default router;
