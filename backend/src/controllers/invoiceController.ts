import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoiceService';
import { CreateInvoiceRequest, UpdateInvoiceRequest, ReportFilters } from '../types';
import { AuthRequest } from '../middleware/auth';

const invoiceService = new InvoiceService();

export class InvoiceController {
  // Invoices In (الواردات)
  async createInvoiceIn(req: AuthRequest, res: Response) {
    try {
      const invoiceData: CreateInvoiceRequest = req.body;
      const invoice = await invoiceService.createInvoiceIn(invoiceData, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء فاتورة الوارد بنجاح',
        data: invoice,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateInvoiceIn(req: AuthRequest, res: Response) {
    try {
      const invoiceId = req.params.id;
      const invoiceData: UpdateInvoiceRequest = req.body;
      const invoice = await invoiceService.updateInvoiceIn(invoiceId, invoiceData, req.user!.id);
      
      res.json({
        success: true,
        message: 'تم تحديث فاتورة الوارد بنجاح',
        data: invoice,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteInvoiceIn(req: AuthRequest, res: Response) {
    try {
      const invoiceId = req.params.id;
      await invoiceService.deleteInvoiceIn(invoiceId);
      
      res.json({
        success: true,
        message: 'تم حذف فاتورة الوارد بنجاح',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getInvoicesIn(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters: ReportFilters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        currency: req.query.currency as string,
        category: req.query.category as string,
        partnerId: req.query.partnerId as string,
      };
      
      const result = await invoiceService.getInvoicesIn(page, limit, filters);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getInvoiceInById(req: AuthRequest, res: Response) {
    try {
      const invoiceId = req.params.id;
      const invoice = await invoiceService.getInvoiceInById(invoiceId);
      
      res.json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Invoices Out (الصادرات)
  async createInvoiceOut(req: AuthRequest, res: Response) {
    try {
      const invoiceData: CreateInvoiceRequest = req.body;
      const invoice = await invoiceService.createInvoiceOut(invoiceData, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء فاتورة الصادر بنجاح',
        data: invoice,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateInvoiceOut(req: AuthRequest, res: Response) {
    try {
      const invoiceId = req.params.id;
      const invoiceData: UpdateInvoiceRequest = req.body;
      const invoice = await invoiceService.updateInvoiceOut(invoiceId, invoiceData, req.user!.id);
      
      res.json({
        success: true,
        message: 'تم تحديث فاتورة الصادر بنجاح',
        data: invoice,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteInvoiceOut(req: AuthRequest, res: Response) {
    try {
      const invoiceId = req.params.id;
      await invoiceService.deleteInvoiceOut(invoiceId);
      
      res.json({
        success: true,
        message: 'تم حذف فاتورة الصادر بنجاح',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getInvoicesOut(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters: ReportFilters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        currency: req.query.currency as string,
        category: req.query.category as string,
        partnerId: req.query.partnerId as string,
      };
      
      const result = await invoiceService.getInvoicesOut(page, limit, filters);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getInvoiceOutById(req: AuthRequest, res: Response) {
    try {
      const invoiceId = req.params.id;
      const invoice = await invoiceService.getInvoiceOutById(invoiceId);
      
      res.json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Statistics
  async getInvoiceStats(req: AuthRequest, res: Response) {
    try {
      const filters: ReportFilters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        currency: req.query.currency as string,
        category: req.query.category as string,
      };
      
      const stats = await invoiceService.getInvoiceStats(filters);
      
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
