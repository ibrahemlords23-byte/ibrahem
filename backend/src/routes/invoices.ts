import { Router } from 'express';
import { InvoiceController } from '../controllers/invoiceController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import { body } from 'express-validator';

const router = Router();
const invoiceController = new InvoiceController();

// Invoices In (الواردات)
router.get('/in',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  invoiceController.getInvoicesIn
);

router.get('/in/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  invoiceController.getInvoiceInById
);

router.post('/in',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  [
    body('amount').isNumeric().withMessage('المبلغ يجب أن يكون رقماً'),
    body('currency').notEmpty().withMessage('العملة مطلوبة'),
    body('date').isISO8601().withMessage('التاريخ غير صحيح'),
  ],
  invoiceController.createInvoiceIn
);

router.put('/in/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  [
    body('amount').optional().isNumeric().withMessage('المبلغ يجب أن يكون رقماً'),
    body('currency').optional().notEmpty().withMessage('العملة مطلوبة'),
    body('date').optional().isISO8601().withMessage('التاريخ غير صحيح'),
  ],
  invoiceController.updateInvoiceIn
);

router.delete('/in/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  invoiceController.deleteInvoiceIn
);

// Invoices Out (الصادرات)
router.get('/out',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  invoiceController.getInvoicesOut
);

router.get('/out/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  invoiceController.getInvoiceOutById
);

router.post('/out',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  [
    body('amount').isNumeric().withMessage('المبلغ يجب أن يكون رقماً'),
    body('currency').notEmpty().withMessage('العملة مطلوبة'),
    body('date').isISO8601().withMessage('التاريخ غير صحيح'),
  ],
  invoiceController.createInvoiceOut
);

router.put('/out/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  [
    body('amount').optional().isNumeric().withMessage('المبلغ يجب أن يكون رقماً'),
    body('currency').optional().notEmpty().withMessage('العملة مطلوبة'),
    body('date').optional().isISO8601().withMessage('التاريخ غير صحيح'),
  ],
  invoiceController.updateInvoiceOut
);

router.delete('/out/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  invoiceController.deleteInvoiceOut
);

// Statistics
router.get('/stats',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  invoiceController.getInvoiceStats
);

export default router;
