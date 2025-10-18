import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import { body } from 'express-validator';

const router = Router();
const inventoryController = new InventoryController();

// Inventory Items
router.get('/items',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER', 'ACCOUNTANT']),
  inventoryController.getInventoryItems
);

router.get('/items/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER', 'ACCOUNTANT']),
  inventoryController.getInventoryItemById
);

router.post('/items',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
  [
    body('sku').notEmpty().withMessage('كود الصنف مطلوب'),
    body('name').notEmpty().withMessage('اسم الصنف مطلوب'),
    body('unit').notEmpty().withMessage('الوحدة مطلوبة'),
    body('minStock').isNumeric().withMessage('الحد الأدنى للمخزون يجب أن يكون رقماً'),
    body('price').isNumeric().withMessage('السعر يجب أن يكون رقماً'),
    body('currency').notEmpty().withMessage('العملة مطلوبة'),
  ],
  inventoryController.createInventoryItem
);

router.put('/items/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
  [
    body('sku').optional().notEmpty().withMessage('كود الصنف مطلوب'),
    body('name').optional().notEmpty().withMessage('اسم الصنف مطلوب'),
    body('unit').optional().notEmpty().withMessage('الوحدة مطلوبة'),
    body('minStock').optional().isNumeric().withMessage('الحد الأدنى للمخزون يجب أن يكون رقماً'),
    body('price').optional().isNumeric().withMessage('السعر يجب أن يكون رقماً'),
    body('currency').optional().notEmpty().withMessage('العملة مطلوبة'),
  ],
  inventoryController.updateInventoryItem
);

router.delete('/items/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  inventoryController.deleteInventoryItem
);

// Inventory Movements
router.get('/movements',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER', 'ACCOUNTANT']),
  inventoryController.getInventoryMovements
);

router.post('/movements',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
  [
    body('itemId').notEmpty().withMessage('معرف الصنف مطلوب'),
    body('type').isIn(['IN', 'OUT']).withMessage('نوع الحركة يجب أن يكون IN أو OUT'),
    body('quantity').isNumeric().withMessage('الكمية يجب أن تكون رقماً'),
    body('date').isISO8601().withMessage('التاريخ غير صحيح'),
  ],
  inventoryController.createInventoryMovement
);

// Statistics
router.get('/stats',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER', 'ACCOUNTANT']),
  inventoryController.getInventoryStats
);

// Low Stock Alert
router.get('/low-stock',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER']),
  inventoryController.getLowStockItems
);

export default router;
