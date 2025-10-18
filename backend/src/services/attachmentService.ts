import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// إعداد multer للمرفقات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// فلتر الملفات المسموحة
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مسموح'));
  }
};

// إعداد multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // حد أقصى 5 ملفات
  },
});

// خدمة المرفقات
export class AttachmentService {
  private uploadsDir = path.join(process.cwd(), 'uploads');
  private thumbnailsDir = path.join(process.cwd(), 'uploads', 'thumbnails');

  constructor() {
    // إنشاء المجلدات المطلوبة
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailsDir)) {
      fs.mkdirSync(this.thumbnailsDir, { recursive: true });
    }
  }

  // حفظ المرفق
  async saveAttachment(file: Express.Multer.File, entityType: string, entityId: string) {
    try {
      const attachment = {
        id: uuidv4(),
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        entityType,
        entityId,
        uploadedAt: new Date(),
      };

      // إنشاء صورة مصغرة للصور
      if (file.mimetype.startsWith('image/')) {
        await this.createThumbnail(file.filename);
      }

      return attachment;
    } catch (error) {
      throw new Error(`خطأ في حفظ المرفق: ${error}`);
    }
  }

  // إنشاء صورة مصغرة
  private async createThumbnail(filename: string) {
    try {
      const inputPath = path.join(this.uploadsDir, filename);
      const outputPath = path.join(this.thumbnailsDir, filename);

      await sharp(inputPath)
        .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
    } catch (error) {
      console.error('خطأ في إنشاء الصورة المصغرة:', error);
    }
  }

  // الحصول على المرفق
  async getAttachment(filename: string) {
    const filePath = path.join(this.uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('الملف غير موجود');
    }

    return {
      path: filePath,
      stats: fs.statSync(filePath),
    };
  }

  // الحصول على الصورة المصغرة
  async getThumbnail(filename: string) {
    const thumbnailPath = path.join(this.thumbnailsDir, filename);
    
    if (fs.existsSync(thumbnailPath)) {
      return thumbnailPath;
    }

    // إذا لم تكن الصورة المصغرة موجودة، إنشاؤها
    const originalPath = path.join(this.uploadsDir, filename);
    if (fs.existsSync(originalPath)) {
      await this.createThumbnail(filename);
      return thumbnailPath;
    }

    throw new Error('الصورة غير موجودة');
  }

  // حذف المرفق
  async deleteAttachment(filename: string) {
    try {
      const filePath = path.join(this.uploadsDir, filename);
      const thumbnailPath = path.join(this.thumbnailsDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }

      return { success: true };
    } catch (error) {
      throw new Error(`خطأ في حذف المرفق: ${error}`);
    }
  }

  // تنظيف المرفقات القديمة
  async cleanupOldAttachments(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const files = fs.readdirSync(this.uploadsDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadsDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          await this.deleteAttachment(file);
          deletedCount++;
        }
      }

      return { success: true, deletedCount };
    } catch (error) {
      throw new Error(`خطأ في تنظيف المرفقات: ${error}`);
    }
  }

  // التحقق من صحة الملف
  validateFile(file: Express.Multer.File) {
    const errors = [];

    // التحقق من الحجم
    if (file.size > 10 * 1024 * 1024) {
      errors.push('حجم الملف يتجاوز 10MB');
    }

    // التحقق من النوع
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('نوع الملف غير مسموح');
    }

    // التحقق من الاسم
    if (file.originalname.length > 255) {
      errors.push('اسم الملف طويل جداً');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // الحصول على معلومات المرفق
  getFileInfo(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      sizeFormatted: this.formatFileSize(file.size),
      extension: path.extname(file.originalname),
      isImage: file.mimetype.startsWith('image/'),
      isPdf: file.mimetype === 'application/pdf',
      isDocument: file.mimetype.includes('document') || file.mimetype.includes('sheet'),
    };
  }

  // تنسيق حجم الملف
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // فحص الملفات المشبوهة
  async scanFile(filePath: string) {
    try {
      // قراءة أول 1024 بايت للفحص
      const buffer = fs.readFileSync(filePath, { start: 0, end: 1024 });
      
      // فحص الملفات التنفيذية
      const executableSignatures = [
        Buffer.from([0x4D, 0x5A]), // PE executable
        Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
      ];

      for (const signature of executableSignatures) {
        if (buffer.includes(signature)) {
          throw new Error('الملف يحتوي على كود تنفيذي');
        }
      }

      // فحص الملفات المضغوطة المشبوهة
      const zipSignature = Buffer.from([0x50, 0x4B, 0x03, 0x04]);
      if (buffer.includes(zipSignature)) {
        // يمكن إضافة فحص إضافي للملفات المضغوطة
        console.log('تم اكتشاف ملف مضغوط - يتطلب فحص إضافي');
      }

      return { safe: true };
    } catch (error) {
      return { safe: false, error: error.message };
    }
  }
}
