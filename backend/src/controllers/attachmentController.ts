import { Request, Response } from 'express';
import { AttachmentService } from '../services/attachmentService';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

const attachmentService = new AttachmentService();

export class AttachmentController {
  // رفع المرفقات
  async uploadAttachments(req: AuthRequest, res: Response) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لم يتم رفع أي ملفات',
        });
      }

      const files = req.files as Express.Multer.File[];
      const entityType = req.body.entityType;
      const entityId = req.body.entityId;

      if (!entityType || !entityId) {
        return res.status(400).json({
          success: false,
          message: 'نوع الكيان ومعرف الكيان مطلوبان',
        });
      }

      const uploadedFiles = [];

      for (const file of files) {
        // التحقق من صحة الملف
        const validation = attachmentService.validateFile(file);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: 'ملف غير صالح',
            errors: validation.errors,
          });
        }

        // فحص الملف المشبوه
        const scanResult = await attachmentService.scanFile(file.path);
        if (!scanResult.safe) {
          // حذف الملف المشبوه
          await attachmentService.deleteAttachment(file.filename);
          return res.status(400).json({
            success: false,
            message: 'ملف مشبوه تم رفضه',
            error: scanResult.error,
          });
        }

        // حفظ المرفق
        const attachment = await attachmentService.saveAttachment(file, entityType, entityId);
        const fileInfo = attachmentService.getFileInfo(file);

        uploadedFiles.push({
          ...attachment,
          ...fileInfo,
        });
      }

      res.json({
        success: true,
        message: `تم رفع ${uploadedFiles.length} ملف بنجاح`,
        data: uploadedFiles,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تحميل المرفق
  async downloadAttachment(req: AuthRequest, res: Response) {
    try {
      const filename = req.params.filename;
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'اسم الملف مطلوب',
        });
      }

      const attachment = await attachmentService.getAttachment(filename);
      
      // تحديد نوع المحتوى
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', attachment.stats.size);
      
      const fileStream = fs.createReadStream(attachment.path);
      fileStream.pipe(res);
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // الحصول على الصورة المصغرة
  async getThumbnail(req: AuthRequest, res: Response) {
    try {
      const filename = req.params.filename;
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'اسم الملف مطلوب',
        });
      }

      const thumbnailPath = await attachmentService.getThumbnail(filename);
      
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      const fileStream = fs.createReadStream(thumbnailPath);
      fileStream.pipe(res);
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // حذف المرفق
  async deleteAttachment(req: AuthRequest, res: Response) {
    try {
      const filename = req.params.filename;
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'اسم الملف مطلوب',
        });
      }

      await attachmentService.deleteAttachment(filename);
      
      res.json({
        success: true,
        message: 'تم حذف المرفق بنجاح',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تنظيف المرفقات القديمة
  async cleanupOldAttachments(req: AuthRequest, res: Response) {
    try {
      const daysOld = parseInt(req.query.days as string) || 30;
      const result = await attachmentService.cleanupOldAttachments(daysOld);
      
      res.json({
        success: true,
        message: `تم تنظيف ${result.deletedCount} مرفق قديم`,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // الحصول على معلومات المرفق
  async getAttachmentInfo(req: AuthRequest, res: Response) {
    try {
      const filename = req.params.filename;
      
      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'اسم الملف مطلوب',
        });
      }

      const attachment = await attachmentService.getAttachment(filename);
      const fileInfo = {
        filename,
        size: attachment.stats.size,
        sizeFormatted: attachmentService.getFileInfo({ 
          originalname: filename, 
          filename, 
          mimetype: '', 
          size: attachment.stats.size 
        } as Express.Multer.File).sizeFormatted,
        createdAt: attachment.stats.birthtime,
        modifiedAt: attachment.stats.mtime,
        isImage: filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/),
        isPdf: filename.toLowerCase().endsWith('.pdf'),
        isDocument: filename.toLowerCase().match(/\.(doc|docx|xls|xlsx)$/),
      };
      
      res.json({
        success: true,
        data: fileInfo,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // قائمة المرفقات
  async listAttachments(req: AuthRequest, res: Response) {
    try {
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId as string;
      
      // يمكن إضافة منطق لاستخراج المرفقات من قاعدة البيانات
      // حالياً نعيد قائمة الملفات من المجلد
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const files = fs.readdirSync(uploadsDir);
      
      const attachments = files.map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          isImage: filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/),
          isPdf: filename.toLowerCase().endsWith('.pdf'),
          isDocument: filename.toLowerCase().match(/\.(doc|docx|xls|xlsx)$/),
        };
      });
      
      res.json({
        success: true,
        data: attachments,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
