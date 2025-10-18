import { Request, Response } from 'express';
import { InventoryService } from '../services/inventoryService';
import { CreateInventoryItemRequest, CreateInventoryMovementRequest, ReportFilters } from '../types';
import { AuthRequest } from '../middleware/auth';

const inventoryService = new InventoryService();

export class InventoryController {
  // Inventory Items
  async createInventoryItem(req: AuthRequest, res: Response) {
    try {
      const itemData: CreateInventoryItemRequest = req.body;
      const item = await inventoryService.createInventoryItem(itemData, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء صنف المخزون بنجاح',
        data: item,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateInventoryItem(req: AuthRequest, res: Response) {
    try {
      const itemId = req.params.id;
      const itemData: Partial<CreateInventoryItemRequest> = req.body;
      const item = await inventoryService.updateInventoryItem(itemId, itemData);
      
      res.json({
        success: true,
        message: 'تم تحديث صنف المخزون بنجاح',
        data: item,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteInventoryItem(req: AuthRequest, res: Response) {
    try {
      const itemId = req.params.id;
      await inventoryService.deleteInventoryItem(itemId);
      
      res.json({
        success: true,
        message: 'تم حذف صنف المخزون بنجاح',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getInventoryItems(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      
      const result = await inventoryService.getInventoryItems(page, limit, search);
      
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

  async getInventoryItemById(req: AuthRequest, res: Response) {
    try {
      const itemId = req.params.id;
      const item = await inventoryService.getInventoryItemById(itemId);
      
      res.json({
        success: true,
        data: item,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Inventory Movements
  async createInventoryMovement(req: AuthRequest, res: Response) {
    try {
      const movementData: CreateInventoryMovementRequest = req.body;
      const movement = await inventoryService.createInventoryMovement(movementData, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء حركة المخزون بنجاح',
        data: movement,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getInventoryMovements(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const itemId = req.query.itemId as string;
      
      const result = await inventoryService.getInventoryMovements(page, limit, itemId);
      
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
  async getInventoryStats(req: AuthRequest, res: Response) {
    try {
      const stats = await inventoryService.getInventoryStats();
      
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

  // Low Stock Alert
  async getLowStockItems(req: AuthRequest, res: Response) {
    try {
      const lowStockItems = await inventoryService.getLowStockItems();
      
      res.json({
        success: true,
        data: lowStockItems,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
