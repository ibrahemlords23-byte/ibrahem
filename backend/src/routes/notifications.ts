import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';

const router = Router();
const notificationController = new NotificationController();

// الحصول على تنبيهات المستخدم
router.get('/',
  authenticateToken,
  notificationController.getUserAlerts
);

// تحديد التنبيه كمقروء
router.put('/:id/read',
  authenticateToken,
  notificationController.markAlertAsRead
);

// تحديد جميع التنبيهات كمقروءة
router.put('/read-all',
  authenticateToken,
  notificationController.markAllAlertsAsRead
);

// حذف التنبيه
router.delete('/:id',
  authenticateToken,
  notificationController.deleteAlert
);

// إحصائيات التنبيهات
router.get('/stats',
  authenticateToken,
  notificationController.getAlertStats
);

// الحصول على التنبيهات حسب النوع
router.get('/type/:type',
  authenticateToken,
  notificationController.getAlertsByType
);

// فحص المخزون المنخفض
router.post('/check/low-stock',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
  notificationController.checkLowStockAlerts
);

// فحص الفواتير المتأخرة
router.post('/check/overdue-invoices',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  notificationController.checkOverdueInvoices
);

// فحص كشوف الرواتب المعلقة
router.post('/check/pending-payrolls',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  notificationController.checkPendingPayrolls
);

// فحص تجاوز الميزانيات
router.post('/check/budget-overruns',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  notificationController.checkBudgetOverruns
);

// تشغيل جميع فحوصات التنبيهات
router.post('/check/all',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  notificationController.runAllAlertChecks
);

// تنظيف التنبيهات القديمة
router.post('/cleanup',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  notificationController.cleanupOldAlerts
);

export default router;
