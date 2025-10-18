import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';
import { ReportFilters } from '../types';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

const reportService = new ReportService();

export class ReportController {
  // تقرير الحركة المالية
  async generateMovementReport(req: AuthRequest, res: Response) {
    try {
      const filters: ReportFilters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        currency: req.query.currency as string,
        category: req.query.category as string,
      };

      const format = (req.query.format as string) || 'pdf';
      
      if (!filters.dateFrom || !filters.dateTo) {
        return res.status(400).json({
          success: false,
          message: 'تاريخ البداية والنهاية مطلوبان',
        });
      }

      const filePath = await reportService.generateMovementReport(filters, format as 'pdf' | 'excel');
      
      res.download(filePath, (err) => {
        if (err) {
          console.error('خطأ في تحميل الملف:', err);
        }
        // حذف الملف بعد التحميل
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تقرير الأرباح والخسائر
  async generateProfitLossReport(req: AuthRequest, res: Response) {
    try {
      const filters: ReportFilters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        currency: req.query.currency as string,
      };

      const format = (req.query.format as string) || 'pdf';
      
      if (!filters.dateFrom || !filters.dateTo) {
        return res.status(400).json({
          success: false,
          message: 'تاريخ البداية والنهاية مطلوبان',
        });
      }

      const filePath = await reportService.generateProfitLossReport(filters, format as 'pdf' | 'excel');
      
      res.download(filePath, (err) => {
        if (err) {
          console.error('خطأ في تحميل الملف:', err);
        }
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تقرير الذمم المدينة والدائنة
  async generateReceivablesPayablesReport(req: AuthRequest, res: Response) {
    try {
      const filters: ReportFilters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        currency: req.query.currency as string,
      };

      const format = (req.query.format as string) || 'pdf';
      
      if (!filters.dateFrom || !filters.dateTo) {
        return res.status(400).json({
          success: false,
          message: 'تاريخ البداية والنهاية مطلوبان',
        });
      }

      const filePath = await reportService.generateReceivablesPayablesReport(filters, format as 'pdf' | 'excel');
      
      res.download(filePath, (err) => {
        if (err) {
          console.error('خطأ في تحميل الملف:', err);
        }
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تقرير كشف المخزون
  async generateInventoryReport(req: AuthRequest, res: Response) {
    try {
      const filters: ReportFilters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        currency: req.query.currency as string,
      };

      const format = (req.query.format as string) || 'pdf';

      const filePath = await reportService.generateInventoryReport(filters, format as 'pdf' | 'excel');
      
      res.download(filePath, (err) => {
        if (err) {
          console.error('خطأ في تحميل الملف:', err);
        }
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تقرير كشف الرواتب
  async generatePayrollReport(req: AuthRequest, res: Response) {
    try {
      const filters: ReportFilters = {
        periodMonth: req.query.periodMonth ? parseInt(req.query.periodMonth as string) : undefined,
        periodYear: req.query.periodYear ? parseInt(req.query.periodYear as string) : undefined,
      };

      const format = (req.query.format as string) || 'pdf';
      
      if (!filters.periodMonth || !filters.periodYear) {
        return res.status(400).json({
          success: false,
          message: 'الشهر والسنة مطلوبان',
        });
      }

      const filePath = await reportService.generatePayrollReport(filters, format as 'pdf' | 'excel');
      
      res.download(filePath, (err) => {
        if (err) {
          console.error('خطأ في تحميل الملف:', err);
        }
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تنظيف التقارير القديمة
  async cleanupOldReports(req: AuthRequest, res: Response) {
    try {
      await reportService.cleanupOldReports();
      
      res.json({
        success: true,
        message: 'تم تنظيف التقارير القديمة بنجاح',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // قائمة أنواع التقارير المتاحة
  async getAvailableReports(req: AuthRequest, res: Response) {
    try {
      const reports = [
        {
          id: 'movement',
          name: 'تقرير الحركة المالية',
          description: 'تقرير شامل للواردات والصادرات',
          requiredFields: ['dateFrom', 'dateTo'],
          optionalFields: ['currency', 'category'],
        },
        {
          id: 'profit-loss',
          name: 'تقرير الأرباح والخسائر',
          description: 'تقرير الأرباح والخسائر المبسط',
          requiredFields: ['dateFrom', 'dateTo'],
          optionalFields: ['currency'],
        },
        {
          id: 'receivables-payables',
          name: 'تقرير الذمم المدينة والدائنة',
          description: 'تقرير الذمم المدينة والدائنة',
          requiredFields: ['dateFrom', 'dateTo'],
          optionalFields: ['currency'],
        },
        {
          id: 'inventory',
          name: 'تقرير كشف المخزون',
          description: 'تقرير شامل لحالة المخزون',
          requiredFields: [],
          optionalFields: ['dateFrom', 'dateTo', 'currency'],
        },
        {
          id: 'payroll',
          name: 'تقرير كشف الرواتب',
          description: 'تقرير رواتب الموظفين',
          requiredFields: ['periodMonth', 'periodYear'],
          optionalFields: [],
        },
      ];

      res.json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
