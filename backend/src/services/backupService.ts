import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { exec } from 'child_process';
import cron from 'cron';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const pipelineAsync = promisify(pipeline);

export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');
  private maxBackups = 30; // الاحتفاظ بـ 30 نسخة احتياطية

  constructor() {
    this.ensureBackupDirectory();
    this.setupScheduledBackups();
  }

  // إنشاء مجلد النسخ الاحتياطية
  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // إعداد النسخ الاحتياطية المجدولة
  private setupScheduledBackups() {
    // نسخة احتياطية يومية في الساعة 2:00 صباحاً
    const dailyBackup = new cron.CronJob('0 2 * * *', async () => {
      try {
        await this.createFullBackup('daily');
        console.log('تم إنشاء النسخة الاحتياطية اليومية');
      } catch (error) {
        console.error('خطأ في النسخة الاحتياطية اليومية:', error);
      }
    });

    // نسخة احتياطية أسبوعية يوم الأحد في الساعة 3:00 صباحاً
    const weeklyBackup = new cron.CronJob('0 3 * * 0', async () => {
      try {
        await this.createFullBackup('weekly');
        console.log('تم إنشاء النسخة الاحتياطية الأسبوعية');
      } catch (error) {
        console.error('خطأ في النسخة الاحتياطية الأسبوعية:', error);
      }
    });

    // نسخة احتياطية شهرية في اليوم الأول من الشهر في الساعة 4:00 صباحاً
    const monthlyBackup = new cron.CronJob('0 4 1 * *', async () => {
      try {
        await this.createFullBackup('monthly');
        console.log('تم إنشاء النسخة الاحتياطية الشهرية');
      } catch (error) {
        console.error('خطأ في النسخة الاحتياطية الشهرية:', error);
      }
    });

    // تنظيف النسخ القديمة يومياً في الساعة 5:00 صباحاً
    const cleanupJob = new cron.CronJob('0 5 * * *', async () => {
      try {
        await this.cleanupOldBackups();
        console.log('تم تنظيف النسخ الاحتياطية القديمة');
      } catch (error) {
        console.error('خطأ في تنظيف النسخ الاحتياطية:', error);
      }
    });

    dailyBackup.start();
    weeklyBackup.start();
    monthlyBackup.start();
    cleanupJob.start();
  }

  // إنشاء نسخة احتياطية كاملة
  async createFullBackup(type: 'manual' | 'daily' | 'weekly' | 'monthly' = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = uuidv4();
    const backupName = `backup-${type}-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);

    try {
      // إنشاء مجلد النسخة الاحتياطية
      fs.mkdirSync(backupPath, { recursive: true });

      // نسخ قاعدة البيانات
      await this.backupDatabase(backupPath);

      // نسخ المرفقات
      await this.backupAttachments(backupPath);

      // نسخ الإعدادات
      await this.backupSettings(backupPath);

      // إنشاء ملف معلومات النسخة الاحتياطية
      await this.createBackupInfo(backupPath, backupId, type);

      // ضغط النسخة الاحتياطية
      const compressedPath = await this.compressBackup(backupPath);

      // حذف المجلد غير المضغوط
      fs.rmSync(backupPath, { recursive: true, force: true });

      // تسجيل النسخة الاحتياطية في قاعدة البيانات
      await this.logBackup(backupId, backupName, type, compressedPath);

      return {
        backupId,
        backupName,
        backupPath: compressedPath,
        size: fs.statSync(compressedPath).size,
        createdAt: new Date(),
      };
    } catch (error) {
      // تنظيف في حالة الخطأ
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      throw error;
    }
  }

  // نسخ قاعدة البيانات
  private async backupDatabase(backupPath: string) {
    const dbPath = path.join(backupPath, 'database');
    fs.mkdirSync(dbPath, { recursive: true });

    // تصدير جميع الجداول
    const tables = [
      'User', 'AuditLog', 'Currency', 'Partner', 'InvoiceIn', 'InvoiceOut',
      'InventoryItem', 'InventoryMovement', 'Employee', 'EmployeeTransaction',
      'Payroll', 'Alert', 'ReportCache'
    ];

    for (const table of tables) {
      try {
        const data = await (prisma as any)[table.toLowerCase()].findMany();
        const filePath = path.join(dbPath, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      } catch (error) {
        console.error(`خطأ في نسخ جدول ${table}:`, error);
      }
    }

    // إنشاء ملف SQL للاستيراد
    const sqlPath = path.join(dbPath, 'schema.sql');
    const schema = await this.generateSchemaSQL();
    fs.writeFileSync(sqlPath, schema);
  }

  // نسخ المرفقات
  private async backupAttachments(backupPath: string) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const backupUploadsDir = path.join(backupPath, 'uploads');

    if (fs.existsSync(uploadsDir)) {
      await this.copyDirectory(uploadsDir, backupUploadsDir);
    }
  }

  // نسخ الإعدادات
  private async backupSettings(backupPath: string) {
    const settingsPath = path.join(backupPath, 'settings');
    fs.mkdirSync(settingsPath, { recursive: true });

    // نسخ ملفات الإعدادات
    const settingsFiles = [
      'package.json',
      'tsconfig.json',
      'prisma/schema.prisma',
    ];

    for (const file of settingsFiles) {
      const sourcePath = path.join(process.cwd(), file);
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(settingsPath, file);
        const destDir = path.dirname(destPath);
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(sourcePath, destPath);
      }
    }

    // نسخ متغيرات البيئة (بدون القيم الحساسة)
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const sanitizedEnv = this.sanitizeEnvFile(envContent);
      fs.writeFileSync(path.join(settingsPath, 'env.example'), sanitizedEnv);
    }
  }

  // إنشاء ملف معلومات النسخة الاحتياطية
  private async createBackupInfo(backupPath: string, backupId: string, type: string) {
    const info = {
      backupId,
      type,
      createdAt: new Date().toISOString(),
      version: '1.0.0',
      description: `نسخة احتياطية ${type} لنظام إبراهيم للمحاسبة`,
      tables: [
        'User', 'AuditLog', 'Currency', 'Partner', 'InvoiceIn', 'InvoiceOut',
        'InventoryItem', 'InventoryMovement', 'Employee', 'EmployeeTransaction',
        'Payroll', 'Alert', 'ReportCache'
      ],
      includes: {
        database: true,
        attachments: true,
        settings: true,
      },
    };

    fs.writeFileSync(
      path.join(backupPath, 'backup-info.json'),
      JSON.stringify(info, null, 2)
    );
  }

  // ضغط النسخة الاحتياطية
  private async compressBackup(backupPath: string): Promise<string> {
    const compressedPath = `${backupPath}.tar.gz`;
    
    return new Promise((resolve, reject) => {
      const command = `tar -czf "${compressedPath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(compressedPath);
        }
      });
    });
  }

  // تسجيل النسخة الاحتياطية
  private async logBackup(backupId: string, backupName: string, type: string, backupPath: string) {
    // يمكن إضافة جدول للنسخ الاحتياطية في قاعدة البيانات
    console.log(`تم إنشاء النسخة الاحتياطية: ${backupName}`);
  }

  // استعادة النسخة الاحتياطية
  async restoreBackup(backupPath: string) {
    try {
      // فحص النسخة الاحتياطية
      const backupInfo = await this.validateBackup(backupPath);

      // استخراج النسخة الاحتياطية
      const extractPath = await this.extractBackup(backupPath);

      // استعادة قاعدة البيانات
      await this.restoreDatabase(extractPath);

      // استعادة المرفقات
      await this.restoreAttachments(extractPath);

      // تنظيف الملفات المؤقتة
      fs.rmSync(extractPath, { recursive: true, force: true });

      return {
        success: true,
        message: 'تم استعادة النسخة الاحتياطية بنجاح',
        restoredAt: new Date(),
      };
    } catch (error) {
      throw new Error(`خطأ في استعادة النسخة الاحتياطية: ${error.message}`);
    }
  }

  // فحص النسخة الاحتياطية
  private async validateBackup(backupPath: string) {
    if (!fs.existsSync(backupPath)) {
      throw new Error('النسخة الاحتياطية غير موجودة');
    }

    // استخراج مؤقت للفحص
    const tempPath = path.join(process.cwd(), 'temp-restore');
    await this.extractBackup(backupPath, tempPath);

    const infoPath = path.join(tempPath, 'backup-info.json');
    if (!fs.existsSync(infoPath)) {
      fs.rmSync(tempPath, { recursive: true, force: true });
      throw new Error('النسخة الاحتياطية تالفة أو غير صالحة');
    }

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    fs.rmSync(tempPath, { recursive: true, force: true });

    return info;
  }

  // استخراج النسخة الاحتياطية
  private async extractBackup(backupPath: string, extractTo?: string): Promise<string> {
    const extractPath = extractTo || path.join(process.cwd(), 'temp-restore');
    
    return new Promise((resolve, reject) => {
      const command = `tar -xzf "${backupPath}" -C "${path.dirname(extractPath)}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(extractPath);
        }
      });
    });
  }

  // استعادة قاعدة البيانات
  private async restoreDatabase(extractPath: string) {
    const dbPath = path.join(extractPath, 'database');
    
    if (!fs.existsSync(dbPath)) {
      throw new Error('بيانات قاعدة البيانات غير موجودة في النسخة الاحتياطية');
    }

    // حذف البيانات الموجودة
    await this.clearDatabase();

    // استيراد البيانات
    const tables = [
      'User', 'AuditLog', 'Currency', 'Partner', 'InvoiceIn', 'InvoiceOut',
      'InventoryItem', 'InventoryMovement', 'Employee', 'EmployeeTransaction',
      'Payroll', 'Alert', 'ReportCache'
    ];

    for (const table of tables) {
      const filePath = path.join(dbPath, `${table}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (data.length > 0) {
            await (prisma as any)[table.toLowerCase()].createMany({
              data,
              skipDuplicates: true,
            });
          }
        } catch (error) {
          console.error(`خطأ في استعادة جدول ${table}:`, error);
        }
      }
    }
  }

  // استعادة المرفقات
  private async restoreAttachments(extractPath: string) {
    const backupUploadsDir = path.join(extractPath, 'uploads');
    const uploadsDir = path.join(process.cwd(), 'uploads');

    if (fs.existsSync(backupUploadsDir)) {
      // حذف المرفقات الموجودة
      if (fs.existsSync(uploadsDir)) {
        fs.rmSync(uploadsDir, { recursive: true, force: true });
      }

      // نسخ المرفقات المستعادة
      await this.copyDirectory(backupUploadsDir, uploadsDir);
    }
  }

  // حذف قاعدة البيانات
  private async clearDatabase() {
    const tables = [
      'Alert', 'ReportCache', 'Payroll', 'EmployeeTransaction', 'Employee',
      'InventoryMovement', 'InventoryItem', 'InvoiceOut', 'InvoiceIn',
      'Partner', 'Currency', 'AuditLog', 'User'
    ];

    for (const table of tables) {
      try {
        await (prisma as any)[table.toLowerCase()].deleteMany();
      } catch (error) {
        console.error(`خطأ في حذف جدول ${table}:`, error);
      }
    }
  }

  // نسخ مجلد
  private async copyDirectory(src: string, dest: string) {
    fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // تنظيف النسخ القديمة
  async cleanupOldBackups() {
    const files = fs.readdirSync(this.backupDir);
    const backupFiles = files
      .filter(file => file.endsWith('.tar.gz'))
      .map(file => ({
        name: file,
        path: path.join(this.backupDir, file),
        stats: fs.statSync(path.join(this.backupDir, file)),
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

    // حذف النسخ الزائدة
    if (backupFiles.length > this.maxBackups) {
      const filesToDelete = backupFiles.slice(this.maxBackups);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`تم حذف النسخة الاحتياطية القديمة: ${file.name}`);
      }
    }
  }

  // قائمة النسخ الاحتياطية
  async listBackups() {
    const files = fs.readdirSync(this.backupDir);
    const backupFiles = files
      .filter(file => file.endsWith('.tar.gz'))
      .map(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          path: filePath,
          size: stats.size,
          sizeFormatted: this.formatFileSize(stats.size),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    return backupFiles;
  }

  // تنسيق حجم الملف
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // تنظيف ملف البيئة
  private sanitizeEnvFile(content: string): string {
    const sensitiveKeys = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SMTP_PASS',
      'FIREBASE_PRIVATE_KEY',
    ];

    return content
      .split('\n')
      .map(line => {
        const key = line.split('=')[0];
        if (sensitiveKeys.includes(key)) {
          return `${key}=your-secret-value-here`;
        }
        return line;
      })
      .join('\n');
  }

  // توليد SQL للمخطط
  private async generateSchemaSQL(): Promise<string> {
    // يمكن إضافة منطق لتوليد SQL للمخطط
    return `-- Schema for Ibrahim Accounting System
-- Generated on ${new Date().toISOString()}

-- This is a placeholder for the actual schema SQL
-- In a real implementation, you would generate the actual CREATE TABLE statements
`;
  }
}
