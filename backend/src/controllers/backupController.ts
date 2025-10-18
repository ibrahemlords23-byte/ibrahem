import { Request, Response } from 'express';
import { BackupService } from '../services/backupService';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const backupService = new BackupService();

// إعداد multer لرفع النسخ الاحتياطية
const upload = multer({
  dest: path.join(process.cwd(), 'temp-uploads'),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

export class BackupController {
  // إنشاء نسخة احتياطية يدوية
  async createBackup(req: AuthRequest, res: Response) {
    try {
      const type = (req.body.type as string) || 'manual';
      const backup = await backupService.createFullBackup(type as any);
      
      res.json({
        success: true,
        message: 'تم إنشاء النسخة الاحتياطية بنجاح',
        data: backup,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // قائمة النسخ الاحتياطية
  async listBackups(req: AuthRequest, res: Response) {
    try {
      const backups = await backupService.listBackups();
      
      res.json({
        success: true,
        data: backups,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تحميل النسخة الاحتياطية
  async downloadBackup(req: AuthRequest, res: Response) {
    try {
      const backupName = req.params.name;
      const backupPath = path.join(process.cwd(), 'backups', backupName);
      
      if (!require('fs').existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          message: 'النسخة الاحتياطية غير موجودة',
        });
      }

      res.download(backupPath, backupName);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // حذف النسخة الاحتياطية
  async deleteBackup(req: AuthRequest, res: Response) {
    try {
      const backupName = req.params.name;
      const backupPath = path.join(process.cwd(), 'backups', backupName);
      
      if (!require('fs').existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          message: 'النسخة الاحتياطية غير موجودة',
        });
      }

      require('fs').unlinkSync(backupPath);
      
      res.json({
        success: true,
        message: 'تم حذف النسخة الاحتياطية بنجاح',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // رفع واستعادة النسخة الاحتياطية
  async restoreBackup(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'لم يتم رفع أي ملف',
        });
      }

      const backupPath = req.file.path;
      const result = await backupService.restoreBackup(backupPath);
      
      // حذف الملف المؤقت
      require('fs').unlinkSync(backupPath);
      
      res.json({
        success: true,
        message: 'تم استعادة النسخة الاحتياطية بنجاح',
        data: result,
      });
    } catch (error: any) {
      // تنظيف الملف المؤقت في حالة الخطأ
      if (req.file && require('fs').existsSync(req.file.path)) {
        require('fs').unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تنظيف النسخ القديمة
  async cleanupOldBackups(req: AuthRequest, res: Response) {
    try {
      await backupService.cleanupOldBackups();
      
      res.json({
        success: true,
        message: 'تم تنظيف النسخ الاحتياطية القديمة بنجاح',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // معلومات النسخة الاحتياطية
  async getBackupInfo(req: AuthRequest, res: Response) {
    try {
      const backupName = req.params.name;
      const backupPath = path.join(process.cwd(), 'backups', backupName);
      
      if (!require('fs').existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          message: 'النسخة الاحتياطية غير موجودة',
        });
      }

      const stats = require('fs').statSync(backupPath);
      const info = {
        name: backupName,
        size: stats.size,
        sizeFormatted: backupService.formatFileSize(stats.size),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
      
      res.json({
        success: true,
        data: info,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // إحصائيات النسخ الاحتياطية
  async getBackupStats(req: AuthRequest, res: Response) {
    try {
      const backups = await backupService.listBackups();
      
      const stats = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
        totalSizeFormatted: backupService.formatFileSize(
          backups.reduce((sum, backup) => sum + backup.size, 0)
        ),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
        newestBackup: backups.length > 0 ? backups[0].createdAt : null,
        averageSize: backups.length > 0 ? 
          backups.reduce((sum, backup) => sum + backup.size, 0) / backups.length : 0,
      };
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Middleware لرفع الملفات
export const uploadBackup = upload.single('backup');
