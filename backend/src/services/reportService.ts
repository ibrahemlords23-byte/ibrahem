import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { ReportFilters, ReportType } from '../types';

const prisma = new PrismaClient();

export class ReportService {
  private reportsDir = path.join(process.cwd(), 'reports');

  constructor() {
    // إنشاء مجلد التقارير إذا لم يكن موجوداً
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // تقرير حركة يومية/شهرية
  async generateMovementReport(filters: ReportFilters, format: 'pdf' | 'excel' = 'pdf') {
    const where: any = {};

    if (filters.dateFrom && filters.dateTo) {
      where.date = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo),
      };
    }

    if (filters.currency) {
      where.currency = filters.currency;
    }

    const [invoicesIn, invoicesOut] = await Promise.all([
      prisma.invoiceIn.findMany({
        where,
        include: {
          vendor: true,
          creator: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.invoiceOut.findMany({
        where,
        include: {
          customer: true,
          creator: true,
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const reportData = {
      title: 'تقرير الحركة المالية',
      period: `${filters.dateFrom} - ${filters.dateTo}`,
      invoicesIn,
      invoicesOut,
      summary: {
        totalIn: invoicesIn.reduce((sum, inv) => sum + Number(inv.amount), 0),
        totalOut: invoicesOut.reduce((sum, inv) => sum + Number(inv.amount), 0),
        netAmount: invoicesOut.reduce((sum, inv) => sum + Number(inv.amount), 0) - 
                  invoicesIn.reduce((sum, inv) => sum + Number(inv.amount), 0),
      },
    };

    if (format === 'pdf') {
      return this.generatePDFReport(reportData, 'movement');
    } else {
      return this.generateExcelReport(reportData, 'movement');
    }
  }

  // تقرير أرباح وخسائر
  async generateProfitLossReport(filters: ReportFilters, format: 'pdf' | 'excel' = 'pdf') {
    const where: any = {};

    if (filters.dateFrom && filters.dateTo) {
      where.date = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo),
      };
    }

    const [invoicesIn, invoicesOut, expenses] = await Promise.all([
      prisma.invoiceOut.findMany({ where }),
      prisma.invoiceIn.findMany({ where }),
      prisma.employeeTransaction.findMany({
        where: {
          type: 'DEDUCTION',
          date: filters.dateFrom && filters.dateTo ? {
            gte: new Date(filters.dateFrom),
            lte: new Date(filters.dateTo),
          } : undefined,
        },
      }),
    ]);

    const revenue = invoicesOut.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const costOfGoods = invoicesIn.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const operatingExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const grossProfit = revenue - costOfGoods;
    const netProfit = grossProfit - operatingExpenses;

    const reportData = {
      title: 'تقرير الأرباح والخسائر',
      period: `${filters.dateFrom} - ${filters.dateTo}`,
      revenue,
      costOfGoods,
      grossProfit,
      operatingExpenses,
      netProfit,
      details: {
        invoicesIn,
        invoicesOut,
        expenses,
      },
    };

    if (format === 'pdf') {
      return this.generatePDFReport(reportData, 'profit-loss');
    } else {
      return this.generateExcelReport(reportData, 'profit-loss');
    }
  }

  // تقرير الذمم المدينة والدائنة
  async generateReceivablesPayablesReport(filters: ReportFilters, format: 'pdf' | 'excel' = 'pdf') {
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      include: {
        invoicesIn: {
          where: filters.dateFrom && filters.dateTo ? {
            date: {
              gte: new Date(filters.dateFrom),
              lte: new Date(filters.dateTo),
            },
          } : undefined,
        },
        invoicesOut: {
          where: filters.dateFrom && filters.dateTo ? {
            date: {
              gte: new Date(filters.dateFrom),
              lte: new Date(filters.dateTo),
            },
          } : undefined,
        },
      },
    });

    const receivables = partners
      .filter(p => p.type === 'CUSTOMER')
      .map(p => ({
        partner: p,
        totalInvoices: p.invoicesOut.reduce((sum, inv) => sum + Number(inv.amount), 0),
        totalPayments: 0, // يمكن إضافة جدول المدفوعات لاحقاً
        balance: p.invoicesOut.reduce((sum, inv) => sum + Number(inv.amount), 0),
      }));

    const payables = partners
      .filter(p => p.type === 'VENDOR')
      .map(p => ({
        partner: p,
        totalInvoices: p.invoicesIn.reduce((sum, inv) => sum + Number(inv.amount), 0),
        totalPayments: 0, // يمكن إضافة جدول المدفوعات لاحقاً
        balance: p.invoicesIn.reduce((sum, inv) => sum + Number(inv.amount), 0),
      }));

    const reportData = {
      title: 'تقرير الذمم المدينة والدائنة',
      period: `${filters.dateFrom} - ${filters.dateTo}`,
      receivables,
      payables,
      summary: {
        totalReceivables: receivables.reduce((sum, r) => sum + r.balance, 0),
        totalPayables: payables.reduce((sum, p) => sum + p.balance, 0),
        netPosition: receivables.reduce((sum, r) => sum + r.balance, 0) - 
                    payables.reduce((sum, p) => sum + p.balance, 0),
      },
    };

    if (format === 'pdf') {
      return this.generatePDFReport(reportData, 'receivables-payables');
    } else {
      return this.generateExcelReport(reportData, 'receivables-payables');
    }
  }

  // تقرير كشف المخزون
  async generateInventoryReport(filters: ReportFilters, format: 'pdf' | 'excel' = 'pdf') {
    const items = await prisma.inventoryItem.findMany({
      where: { isActive: true },
      include: {
        movements: {
          where: filters.dateFrom && filters.dateTo ? {
            date: {
              gte: new Date(filters.dateFrom),
              lte: new Date(filters.dateTo),
            },
          } : undefined,
        },
      },
    });

    const inventoryData = items.map(item => {
      const totalIn = item.movements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const totalOut = item.movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const currentStock = totalIn - totalOut;
      const totalValue = currentStock * Number(item.price);
      
      return {
        item,
        totalIn,
        totalOut,
        currentStock,
        totalValue,
        isLowStock: currentStock <= Number(item.minStock),
      };
    });

    const reportData = {
      title: 'تقرير كشف المخزون',
      period: `${filters.dateFrom} - ${filters.dateTo}`,
      items: inventoryData,
      summary: {
        totalItems: items.length,
        totalValue: inventoryData.reduce((sum, item) => sum + item.totalValue, 0),
        lowStockItems: inventoryData.filter(item => item.isLowStock).length,
      },
    };

    if (format === 'pdf') {
      return this.generatePDFReport(reportData, 'inventory');
    } else {
      return this.generateExcelReport(reportData, 'inventory');
    }
  }

  // تقرير كشف الرواتب
  async generatePayrollReport(filters: ReportFilters, format: 'pdf' | 'excel' = 'pdf') {
    const payrolls = await prisma.payroll.findMany({
      where: {
        periodYear: filters.periodYear,
        periodMonth: filters.periodMonth,
      },
      include: {
        employee: true,
        approver: true,
      },
    });

    const reportData = {
      title: 'تقرير كشف الرواتب',
      period: `${filters.periodYear}/${filters.periodMonth}`,
      payrolls,
      summary: {
        totalEmployees: payrolls.length,
        totalGrossSalary: payrolls.reduce((sum, p) => sum + Number(p.grossSalary), 0),
        totalNetSalary: payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0),
        totalDeductions: payrolls.reduce((sum, p) => 
          sum + Number(p.totalAdvances) + Number(p.totalAbsences) + Number(p.totalDeductions), 0),
        approvedPayrolls: payrolls.filter(p => p.approvedBy).length,
      },
    };

    if (format === 'pdf') {
      return this.generatePDFReport(reportData, 'payroll');
    } else {
      return this.generateExcelReport(reportData, 'payroll');
    }
  }

  // توليد تقرير PDF
  private async generatePDFReport(data: any, type: string): Promise<string> {
    const fileName = `${type}-report-${Date.now()}.pdf`;
    const filePath = path.join(this.reportsDir, fileName);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: data.title,
        Author: 'نظام إبراهيم للمحاسبة',
        Subject: data.title,
        Keywords: 'تقرير, محاسبة, نظام إبراهيم',
      },
    });

    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(20).text(data.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`الفترة: ${data.period}`, { align: 'center' });
    doc.moveDown();

    // Content based on report type
    switch (type) {
      case 'movement':
        this.addMovementPDFContent(doc, data);
        break;
      case 'profit-loss':
        this.addProfitLossPDFContent(doc, data);
        break;
      case 'receivables-payables':
        this.addReceivablesPayablesPDFContent(doc, data);
        break;
      case 'inventory':
        this.addInventoryPDFContent(doc, data);
        break;
      case 'payroll':
        this.addPayrollPDFContent(doc, data);
        break;
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(filePath));
      doc.on('error', reject);
    });
  }

  // توليد تقرير Excel
  private async generateExcelReport(data: any, type: string): Promise<string> {
    const fileName = `${type}-report-${Date.now()}.xlsx`;
    const filePath = path.join(this.reportsDir, fileName);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(data.title);

    // Header
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = data.title;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:D2');
    worksheet.getCell('A2').value = `الفترة: ${data.period}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Content based on report type
    switch (type) {
      case 'movement':
        this.addMovementExcelContent(worksheet, data);
        break;
      case 'profit-loss':
        this.addProfitLossExcelContent(worksheet, data);
        break;
      case 'receivables-payables':
        this.addReceivablesPayablesExcelContent(worksheet, data);
        break;
      case 'inventory':
        this.addInventoryExcelContent(worksheet, data);
        break;
      case 'payroll':
        this.addPayrollExcelContent(worksheet, data);
        break;
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  // إضافة محتوى تقرير الحركة لـ PDF
  private addMovementPDFContent(doc: PDFDocument, data: any) {
    doc.fontSize(14).text('ملخص الحركة', { underline: true });
    doc.moveDown(0.5);
    
    doc.text(`إجمالي الواردات: ${data.summary.totalIn.toLocaleString()}`);
    doc.text(`إجمالي الصادرات: ${data.summary.totalOut.toLocaleString()}`);
    doc.text(`صافي الحركة: ${data.summary.netAmount.toLocaleString()}`);
    doc.moveDown();

    // فواتير الواردات
    doc.fontSize(12).text('فواتير الواردات', { underline: true });
    doc.moveDown(0.5);
    
    data.invoicesIn.forEach((invoice: any, index: number) => {
      doc.text(`${index + 1}. ${invoice.vendor?.name || 'غير محدد'} - ${Number(invoice.amount).toLocaleString()} ${invoice.currency} - ${new Date(invoice.date).toLocaleDateString('ar-SA')}`);
    });
    
    doc.moveDown();

    // فواتير الصادرات
    doc.fontSize(12).text('فواتير الصادرات', { underline: true });
    doc.moveDown(0.5);
    
    data.invoicesOut.forEach((invoice: any, index: number) => {
      doc.text(`${index + 1}. ${invoice.customer?.name || 'غير محدد'} - ${Number(invoice.amount).toLocaleString()} ${invoice.currency} - ${new Date(invoice.date).toLocaleDateString('ar-SA')}`);
    });
  }

  // إضافة محتوى تقرير الحركة لـ Excel
  private addMovementExcelContent(worksheet: ExcelJS.Worksheet, data: any) {
    let row = 4;

    // ملخص الحركة
    worksheet.getCell(`A${row}`).value = 'ملخص الحركة';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;

    worksheet.getCell(`A${row}`).value = 'إجمالي الواردات';
    worksheet.getCell(`B${row}`).value = data.summary.totalIn;
    row++;

    worksheet.getCell(`A${row}`).value = 'إجمالي الصادرات';
    worksheet.getCell(`B${row}`).value = data.summary.totalOut;
    row++;

    worksheet.getCell(`A${row}`).value = 'صافي الحركة';
    worksheet.getCell(`B${row}`).value = data.summary.netAmount;
    worksheet.getCell(`B${row}`).font = { bold: true };
    row += 2;

    // فواتير الواردات
    worksheet.getCell(`A${row}`).value = 'فواتير الواردات';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;

    worksheet.getCell(`A${row}`).value = 'المورد';
    worksheet.getCell(`B${row}`).value = 'المبلغ';
    worksheet.getCell(`C${row}`).value = 'العملة';
    worksheet.getCell(`D${row}`).value = 'التاريخ';
    row++;

    data.invoicesIn.forEach((invoice: any) => {
      worksheet.getCell(`A${row}`).value = invoice.vendor?.name || 'غير محدد';
      worksheet.getCell(`B${row}`).value = Number(invoice.amount);
      worksheet.getCell(`C${row}`).value = invoice.currency;
      worksheet.getCell(`D${row}`).value = new Date(invoice.date).toLocaleDateString('ar-SA');
      row++;
    });

    row++;

    // فواتير الصادرات
    worksheet.getCell(`A${row}`).value = 'فواتير الصادرات';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;

    worksheet.getCell(`A${row}`).value = 'العميل';
    worksheet.getCell(`B${row}`).value = 'المبلغ';
    worksheet.getCell(`C${row}`).value = 'العملة';
    worksheet.getCell(`D${row}`).value = 'التاريخ';
    row++;

    data.invoicesOut.forEach((invoice: any) => {
      worksheet.getCell(`A${row}`).value = invoice.customer?.name || 'غير محدد';
      worksheet.getCell(`B${row}`).value = Number(invoice.amount);
      worksheet.getCell(`C${row}`).value = invoice.currency;
      worksheet.getCell(`D${row}`).value = new Date(invoice.date).toLocaleDateString('ar-SA');
      row++;
    });
  }

  // إضافة محتوى تقرير الأرباح والخسائر لـ PDF
  private addProfitLossPDFContent(doc: PDFDocument, data: any) {
    doc.fontSize(14).text('ملخص الأرباح والخسائر', { underline: true });
    doc.moveDown(0.5);
    
    doc.text(`الإيرادات: ${data.revenue.toLocaleString()}`);
    doc.text(`تكلفة البضائع: ${data.costOfGoods.toLocaleString()}`);
    doc.text(`إجمالي الربح: ${data.grossProfit.toLocaleString()}`);
    doc.text(`المصروفات التشغيلية: ${data.operatingExpenses.toLocaleString()}`);
    doc.text(`صافي الربح: ${data.netProfit.toLocaleString()}`);
  }

  // إضافة محتوى تقرير الأرباح والخسائر لـ Excel
  private addProfitLossExcelContent(worksheet: ExcelJS.Worksheet, data: any) {
    let row = 4;

    worksheet.getCell(`A${row}`).value = 'الإيرادات';
    worksheet.getCell(`B${row}`).value = data.revenue;
    row++;

    worksheet.getCell(`A${row}`).value = 'تكلفة البضائع';
    worksheet.getCell(`B${row}`).value = data.costOfGoods;
    row++;

    worksheet.getCell(`A${row}`).value = 'إجمالي الربح';
    worksheet.getCell(`B${row}`).value = data.grossProfit;
    worksheet.getCell(`B${row}`).font = { bold: true };
    row++;

    worksheet.getCell(`A${row}`).value = 'المصروفات التشغيلية';
    worksheet.getCell(`B${row}`).value = data.operatingExpenses;
    row++;

    worksheet.getCell(`A${row}`).value = 'صافي الربح';
    worksheet.getCell(`B${row}`).value = data.netProfit;
    worksheet.getCell(`B${row}`).font = { bold: true };
  }

  // إضافة محتوى تقرير الذمم لـ PDF
  private addReceivablesPayablesPDFContent(doc: PDFDocument, data: any) {
    doc.fontSize(14).text('الذمم المدينة', { underline: true });
    doc.moveDown(0.5);
    
    data.receivables.forEach((receivable: any, index: number) => {
      doc.text(`${index + 1}. ${receivable.partner.name} - ${receivable.balance.toLocaleString()}`);
    });
    
    doc.moveDown();
    
    doc.fontSize(14).text('الذمم الدائنة', { underline: true });
    doc.moveDown(0.5);
    
    data.payables.forEach((payable: any, index: number) => {
      doc.text(`${index + 1}. ${payable.partner.name} - ${payable.balance.toLocaleString()}`);
    });
  }

  // إضافة محتوى تقرير الذمم لـ Excel
  private addReceivablesPayablesExcelContent(worksheet: ExcelJS.Worksheet, data: any) {
    let row = 4;

    worksheet.getCell(`A${row}`).value = 'الذمم المدينة';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;

    worksheet.getCell(`A${row}`).value = 'العميل';
    worksheet.getCell(`B${row}`).value = 'الرصيد';
    row++;

    data.receivables.forEach((receivable: any) => {
      worksheet.getCell(`A${row}`).value = receivable.partner.name;
      worksheet.getCell(`B${row}`).value = receivable.balance;
      row++;
    });

    row++;

    worksheet.getCell(`A${row}`).value = 'الذمم الدائنة';
    worksheet.getCell(`A${row}`).font = { bold: true };
    row++;

    worksheet.getCell(`A${row}`).value = 'المورد';
    worksheet.getCell(`B${row}`).value = 'الرصيد';
    row++;

    data.payables.forEach((payable: any) => {
      worksheet.getCell(`A${row}`).value = payable.partner.name;
      worksheet.getCell(`B${row}`).value = payable.balance;
      row++;
    });
  }

  // إضافة محتوى تقرير المخزون لـ PDF
  private addInventoryPDFContent(doc: PDFDocument, data: any) {
    doc.fontSize(14).text('كشف المخزون', { underline: true });
    doc.moveDown(0.5);
    
    data.items.forEach((item: any, index: number) => {
      doc.text(`${index + 1}. ${item.item.name} - المخزون الحالي: ${item.currentStock} ${item.item.unit} - القيمة: ${item.totalValue.toLocaleString()}`);
    });
  }

  // إضافة محتوى تقرير المخزون لـ Excel
  private addInventoryExcelContent(worksheet: ExcelJS.Worksheet, data: any) {
    let row = 4;

    worksheet.getCell(`A${row}`).value = 'الصنف';
    worksheet.getCell(`B${row}`).value = 'المخزون الحالي';
    worksheet.getCell(`C${row}`).value = 'الوحدة';
    worksheet.getCell(`D${row}`).value = 'القيمة';
    row++;

    data.items.forEach((item: any) => {
      worksheet.getCell(`A${row}`).value = item.item.name;
      worksheet.getCell(`B${row}`).value = item.currentStock;
      worksheet.getCell(`C${row}`).value = item.item.unit;
      worksheet.getCell(`D${row}`).value = item.totalValue;
      row++;
    });
  }

  // إضافة محتوى تقرير الرواتب لـ PDF
  private addPayrollPDFContent(doc: PDFDocument, data: any) {
    doc.fontSize(14).text('كشف الرواتب', { underline: true });
    doc.moveDown(0.5);
    
    data.payrolls.forEach((payroll: any, index: number) => {
      doc.text(`${index + 1}. ${payroll.employee.name} - الراتب الصافي: ${Number(payroll.netSalary).toLocaleString()} ${payroll.currency}`);
    });
  }

  // إضافة محتوى تقرير الرواتب لـ Excel
  private addPayrollExcelContent(worksheet: ExcelJS.Worksheet, data: any) {
    let row = 4;

    worksheet.getCell(`A${row}`).value = 'الموظف';
    worksheet.getCell(`B${row}`).value = 'الراتب الأساسي';
    worksheet.getCell(`C${row}`).value = 'الخصومات';
    worksheet.getCell(`D${row}`).value = 'الراتب الصافي';
    row++;

    data.payrolls.forEach((payroll: any) => {
      worksheet.getCell(`A${row}`).value = payroll.employee.name;
      worksheet.getCell(`B${row}`).value = Number(payroll.grossSalary);
      worksheet.getCell(`C${row}`).value = Number(payroll.totalAdvances) + Number(payroll.totalAbsences) + Number(payroll.totalDeductions);
      worksheet.getCell(`D${row}`).value = Number(payroll.netSalary);
      row++;
    });
  }

  // تنظيف الملفات القديمة
  async cleanupOldReports() {
    const files = fs.readdirSync(this.reportsDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 أيام

    for (const file of files) {
      const filePath = path.join(this.reportsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
      }
    }
  }
}