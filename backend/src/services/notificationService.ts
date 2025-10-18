import { PrismaClient } from '@prisma/client';
import { AlertType, AlertPriority } from '../types';

const prisma = new PrismaClient();

export class NotificationService {
  // إنشاء تنبيه جديد
  async createAlert(
    type: AlertType,
    title: string,
    message: string,
    priority: AlertPriority = 'MEDIUM',
    metadata?: any,
    userId?: string
  ) {
    const alert = await prisma.alert.create({
      data: {
        type,
        title,
        message,
        priority,
        metadata: metadata || {},
        userId,
        isRead: false,
      },
    });

    // إرسال إشعار فوري إذا كان المستخدم متصلاً
    if (userId) {
      await this.sendRealTimeNotification(userId, alert);
    }

    return alert;
  }

  // الحصول على التنبيهات للمستخدم
  async getUserAlerts(userId: string, limit: number = 50) {
    const alerts = await prisma.alert.findMany({
      where: {
        OR: [
          { userId },
          { userId: null }, // تنبيهات عامة
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return alerts;
  }

  // تحديد التنبيه كمقروء
  async markAlertAsRead(alertId: string, userId: string) {
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });

    return alert;
  }

  // تحديد جميع التنبيهات كمقروءة
  async markAllAlertsAsRead(userId: string) {
    await prisma.alert.updateMany({
      where: {
        OR: [
          { userId },
          { userId: null },
        ],
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  // حذف التنبيهات القديمة
  async cleanupOldAlerts(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await prisma.alert.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });
  }

  // فحص المخزون المنخفض وإنشاء تنبيهات
  async checkLowStockAlerts() {
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
        minStock: { gt: 0 },
      },
      include: {
        movements: true,
      },
    });

    const alerts = [];

    for (const item of lowStockItems) {
      const totalIn = item.movements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const totalOut = item.movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const currentStock = totalIn - totalOut;

      if (currentStock <= Number(item.minStock)) {
        const alert = await this.createAlert(
          'LOW_STOCK',
          `تنبيه مخزون منخفض - ${item.name}`,
          `المخزون الحالي: ${currentStock} ${item.unit} - الحد الأدنى: ${item.minStock} ${item.unit}`,
          'HIGH',
          {
            itemId: item.id,
            itemName: item.name,
            currentStock,
            minStock: Number(item.minStock),
            unit: item.unit,
          }
        );
        alerts.push(alert);
      }
    }

    return alerts;
  }

  // فحص الفواتير المتأخرة وإنشاء تنبيهات
  async checkOverdueInvoices() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const overdueInvoices = await prisma.invoiceOut.findMany({
      where: {
        date: {
          lt: thirtyDaysAgo,
        },
        // يمكن إضافة حالة الدفع لاحقاً
      },
      include: {
        customer: true,
      },
    });

    const alerts = [];

    for (const invoice of overdueInvoices) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(invoice.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      const alert = await this.createAlert(
        'OVERDUE_INVOICE',
        `فاتورة متأخرة - ${invoice.customer?.name || 'غير محدد'}`,
        `فاتورة رقم ${invoice.id} متأخرة ${daysOverdue} يوم - المبلغ: ${Number(invoice.amount).toLocaleString()} ${invoice.currency}`,
        'HIGH',
        {
          invoiceId: invoice.id,
          customerName: invoice.customer?.name,
          amount: Number(invoice.amount),
          currency: invoice.currency,
          daysOverdue,
        }
      );
      alerts.push(alert);
    }

    return alerts;
  }

  // فحص كشوف الرواتب المعلقة
  async checkPendingPayrolls() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const pendingPayrolls = await prisma.payroll.findMany({
      where: {
        periodMonth: currentMonth,
        periodYear: currentYear,
        approvedBy: null,
      },
      include: {
        employee: true,
      },
    });

    const alerts = [];

    if (pendingPayrolls.length > 0) {
      const alert = await this.createAlert(
        'PENDING_PAYROLL',
        `كشوف رواتب معلقة - ${currentMonth}/${currentYear}`,
        `يوجد ${pendingPayrolls.length} كشف راتب معلق يحتاج إلى اعتماد`,
        'MEDIUM',
        {
          pendingCount: pendingPayrolls.length,
          periodMonth: currentMonth,
          periodYear: currentYear,
          payrolls: pendingPayrolls.map(p => ({
            id: p.id,
            employeeName: p.employee.name,
            netSalary: Number(p.netSalary),
          })),
        }
      );
      alerts.push(alert);
    }

    return alerts;
  }

  // فحص تجاوز الميزانيات
  async checkBudgetOverruns() {
    // يمكن إضافة نظام الميزانيات لاحقاً
    // حالياً نفحص إذا تجاوزت المصروفات نسبة معينة من الإيرادات
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [invoicesIn, invoicesOut] = await Promise.all([
      prisma.invoiceIn.aggregate({
        where: {
          date: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
        _sum: { amount: true },
      }),
      prisma.invoiceOut.aggregate({
        where: {
          date: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalExpenses = Number(invoicesIn._sum.amount || 0);
    const totalRevenue = Number(invoicesOut._sum.amount || 0);

    if (totalRevenue > 0 && totalExpenses > totalRevenue * 0.8) {
      const alert = await this.createAlert(
        'BUDGET_OVERRUN',
        'تنبيه تجاوز الميزانية',
        `المصروفات (${totalExpenses.toLocaleString()}) تجاوزت 80% من الإيرادات (${totalRevenue.toLocaleString()})`,
        'HIGH',
        {
          totalExpenses,
          totalRevenue,
          percentage: (totalExpenses / totalRevenue) * 100,
          periodMonth: currentMonth,
          periodYear: currentYear,
        }
      );

      return [alert];
    }

    return [];
  }

  // فحص تغييرات الصلاحيات
  async checkPermissionChanges(userId: string, oldRole: string, newRole: string) {
    if (oldRole !== newRole) {
      const alert = await this.createAlert(
        'PERMISSION_CHANGE',
        'تغيير في الصلاحيات',
        `تم تغيير صلاحيات المستخدم من ${oldRole} إلى ${newRole}`,
        'MEDIUM',
        {
          userId,
          oldRole,
          newRole,
          changedAt: new Date(),
        }
      );

      return alert;
    }

    return null;
  }

  // إرسال إشعار فوري (WebSocket أو Server-Sent Events)
  private async sendRealTimeNotification(userId: string, alert: any) {
    // يمكن إضافة WebSocket أو Server-Sent Events هنا
    // حالياً نكتفي بحفظ التنبيه في قاعدة البيانات
    console.log(`إشعار فوري للمستخدم ${userId}:`, alert.title);
  }

  // تشغيل جميع فحوصات التنبيهات
  async runAllAlertChecks() {
    const results = await Promise.allSettled([
      this.checkLowStockAlerts(),
      this.checkOverdueInvoices(),
      this.checkPendingPayrolls(),
      this.checkBudgetOverruns(),
    ]);

    const allAlerts = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allAlerts.push(...result.value);
      } else {
        console.error('خطأ في فحص التنبيهات:', result.reason);
      }
    });

    return allAlerts;
  }

  // إحصائيات التنبيهات
  async getAlertStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, unread, highPriority] = await Promise.all([
      prisma.alert.count({ where }),
      prisma.alert.count({ where: { ...where, isRead: false } }),
      prisma.alert.count({ where: { ...where, priority: 'HIGH' } }),
    ]);

    return {
      total,
      unread,
      highPriority,
      read: total - unread,
    };
  }

  // الحصول على التنبيهات حسب النوع
  async getAlertsByType(type: AlertType, limit: number = 20) {
    const alerts = await prisma.alert.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return alerts;
  }

  // حذف التنبيه
  async deleteAlert(alertId: string, userId: string) {
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new Error('التنبيه غير موجود');
    }

    if (alert.userId && alert.userId !== userId) {
      throw new Error('غير مسموح بحذف هذا التنبيه');
    }

    await prisma.alert.delete({
      where: { id: alertId },
    });

    return { success: true };
  }
}
