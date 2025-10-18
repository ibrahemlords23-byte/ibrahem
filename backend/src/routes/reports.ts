import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';

const router = Router();
const reportController = new ReportController();

// تقرير الحركة المالية
router.get('/movement',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  reportController.generateMovementReport
);

// تقرير الأرباح والخسائر
router.get('/profit-loss',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  reportController.generateProfitLossReport
);

// تقرير الذمم المدينة والدائنة
router.get('/receivables-payables',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  reportController.generateReceivablesPayablesReport
);

// تقرير كشف المخزون
router.get('/inventory',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER', 'ACCOUNTANT']),
  reportController.generateInventoryReport
);

// تقرير كشف الرواتب
router.get('/payroll',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  reportController.generatePayrollReport
);

// تنظيف التقارير القديمة
router.post('/cleanup',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  reportController.cleanupOldReports
);

// قائمة أنواع التقارير المتاحة
router.get('/available',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  reportController.getAvailableReports
);

export default router;
