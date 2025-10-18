import { Request, Response } from 'express';
import { PartnerService } from '../services/partnerService';
import { CreatePartnerRequest } from '../types';
import { AuthRequest } from '../middleware/auth';

const partnerService = new PartnerService();

export class PartnerController {
  async createPartner(req: AuthRequest, res: Response) {
    try {
      const partnerData: CreatePartnerRequest = req.body;
      const partner = await partnerService.createPartner(partnerData, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء الشريك بنجاح',
        data: partner,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updatePartner(req: AuthRequest, res: Response) {
    try {
      const partnerId = req.params.id;
      const partnerData: Partial<CreatePartnerRequest> = req.body;
      const partner = await partnerService.updatePartner(partnerId, partnerData);
      
      res.json({
        success: true,
        message: 'تم تحديث الشريك بنجاح',
        data: partner,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deletePartner(req: AuthRequest, res: Response) {
    try {
      const partnerId = req.params.id;
      await partnerService.deletePartner(partnerId);
      
      res.json({
        success: true,
        message: 'تم حذف الشريك بنجاح',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getPartners(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as 'CUSTOMER' | 'VENDOR';
      const search = req.query.search as string;
      
      const result = await partnerService.getPartners(page, limit, type, search);
      
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

  async getPartnerById(req: AuthRequest, res: Response) {
    try {
      const partnerId = req.params.id;
      const partner = await partnerService.getPartnerById(partnerId);
      
      res.json({
        success: true,
        data: partner,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getCustomers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      
      const result = await partnerService.getCustomers(page, limit, search);
      
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

  async getVendors(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      
      const result = await partnerService.getVendors(page, limit, search);
      
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

  // Statistics
  async getPartnerStats(req: AuthRequest, res: Response) {
    try {
      const stats = await partnerService.getPartnerStats();
      
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

  // Top Customers/Vendors
  async getTopCustomers(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topCustomers = await partnerService.getTopCustomers(limit);
      
      res.json({
        success: true,
        data: topCustomers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTopVendors(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topVendors = await partnerService.getTopVendors(limit);
      
      res.json({
        success: true,
        data: topVendors,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
