import { Router } from 'express';
import { AttachmentController } from '../controllers/attachmentController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import { upload } from '../services/attachmentService';

const router = Router();
const attachmentController = new AttachmentController();

// رفع المرفقات
router.post('/upload',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER']),
  upload.array('attachments', 5), // حد أقصى 5 ملفات
  attachmentController.uploadAttachments
);

// تحميل المرفق
router.get('/download/:filename',
  authenticateToken,
  attachmentController.downloadAttachment
);

// الحصول على الصورة المصغرة
router.get('/thumbnail/:filename',
  authenticateToken,
  attachmentController.getThumbnail
);

// حذف المرفق
router.delete('/:filename',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER']),
  attachmentController.deleteAttachment
);

// الحصول على معلومات المرفق
router.get('/info/:filename',
  authenticateToken,
  attachmentController.getAttachmentInfo
);

// قائمة المرفقات
router.get('/list',
  authenticateToken,
  attachmentController.listAttachments
);

// تنظيف المرفقات القديمة
router.post('/cleanup',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  attachmentController.cleanupOldAttachments
);

export default router;
