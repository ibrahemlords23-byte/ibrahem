import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { AuthRequest } from '../middleware/auth';

const notificationService = new NotificationService();

export class NotificationController {
  // الحصول على تنبيهات المستخدم
  async getUserAlerts(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const alerts = await notificationService.getUserAlerts(req.user!.id, limit);
      
      res.json({
        success: true,
        data: alerts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تحديد التنبيه كمقروء
  async markAlertAsRead(req: AuthRequest, res: Response) {
    try {
      const alertId = req.params.id;
      const alert = await notificationService.markAlertAsRead(alertId, req.user!.id);
      
      res.json({
        success: true,
        message: 'تم تحديد التنبيه كمقروء',
        data: alert,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تحديد جميع التنبيهات كمقروءة
  async markAllAlertsAsRead(req: AuthRequest, res: Response) {
    try {
      await notificationService.markAllAlertsAsRead(req.user!.id);
      
      res.json({
        success: true,
        message: 'تم تحديد جميع التنبيهات كمقروءة',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // حذف التنبيه
  async deleteAlert(req: AuthRequest, res: Response) {
    try {
      const alertId = req.params.id;
      await notificationService.deleteAlert(alertId, req.user!.id);
      
      res.json({
        success: true,
        message: 'تم حذف التنبيه بنجاح',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // فحص المخزون المنخفض
  async checkLowStockAlerts(req: AuthRequest, res: Response) {
    try {
      const alerts = await notificationService.checkLowStockAlerts();
      
      res.json({
        success: true,
        message: `تم إنشاء ${alerts.length} تنبيه للمخزون المنخفض`,
        data: alerts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // فحص الفواتير المتأخرة
  async checkOverdueInvoices(req: AuthRequest, res: Response) {
    try {
      const alerts = await notificationService.checkOverdueInvoices();
      
      res.json({
        success: true,
        message: `تم إنشاء ${alerts.length} تنبيه للفواتير المتأخرة`,
        data: alerts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // فحص كشوف الرواتب المعلقة
  async checkPendingPayrolls(req: AuthRequest, res: Response) {
    try {
      const alerts = await notificationService.checkPendingPayrolls();
      
      res.json({
        success: true,
        message: `تم إنشاء ${alerts.length} تنبيه لكشوف الرواتب المعلقة`,
        data: alerts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // فحص تجاوز الميزانيات
  async checkBudgetOverruns(req: AuthRequest, res: Response) {
    try {
      const alerts = await notificationService.checkBudgetOverruns();
      
      res.json({
        success: true,
        message: `تم إنشاء ${alerts.length} تنبيه لتجاوز الميزانيات`,
        data: alerts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تشغيل جميع فحوصات التنبيهات
  async runAllAlertChecks(req: AuthRequest, res: Response) {
    try {
      const alerts = await notificationService.runAllAlertChecks();
      
      res.json({
        success: true,
        message: `تم إنشاء ${alerts.length} تنبيه إجمالي`,
        data: alerts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // إحصائيات التنبيهات
  async getAlertStats(req: AuthRequest, res: Response) {
    try {
      const stats = await notificationService.getAlertStats(req.user!.id);
      
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

  // الحصول على التنبيهات حسب النوع
  async getAlertsByType(req: AuthRequest, res: Response) {
    try {
      const type = req.params.type as any;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const alerts = await notificationService.getAlertsByType(type, limit);
      
      res.json({
        success: true,
        data: alerts,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // تنظيف التنبيهات القديمة
  async cleanupOldAlerts(req: AuthRequest, res: Response) {
    try {
      const daysOld = parseInt(req.query.days as string) || 30;
      await notificationService.cleanupOldAlerts(daysOld);
      
      res.json({
        success: true,
        message: `تم تنظيف التنبيهات الأقدم من ${daysOld} يوم`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
