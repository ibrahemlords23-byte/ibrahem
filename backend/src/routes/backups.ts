import { Router } from 'express';
import { BackupController, uploadBackup } from '../controllers/backupController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';

const router = Router();
const backupController = new BackupController();

// إنشاء نسخة احتياطية يدوية
router.post('/create',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  backupController.createBackup
);

// قائمة النسخ الاحتياطية
router.get('/list',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  backupController.listBackups
);

// تحميل النسخة الاحتياطية
router.get('/download/:name',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  backupController.downloadBackup
);

// حذف النسخة الاحتياطية
router.delete('/:name',
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  backupController.deleteBackup
);

// رفع واستعادة النسخة الاحتياطية
router.post('/restore',
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  uploadBackup,
  backupController.restoreBackup
);

// تنظيف النسخ القديمة
router.post('/cleanup',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  backupController.cleanupOldBackups
);

// معلومات النسخة الاحتياطية
router.get('/info/:name',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  backupController.getBackupInfo
);

// إحصائيات النسخ الاحتياطية
router.get('/stats',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  backupController.getBackupStats
);

export default router;
