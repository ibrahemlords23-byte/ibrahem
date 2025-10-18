import { PrismaClient } from '@prisma/client';
import { CreateInventoryItemRequest, CreateInventoryMovementRequest, ReportFilters } from '../types';

const prisma = new PrismaClient();

export class InventoryService {
  // Inventory Items
  async createInventoryItem(data: CreateInventoryItemRequest, createdBy: string) {
    const item = await prisma.inventoryItem.create({
      data: {
        sku: data.sku,
        name: data.name,
        unit: data.unit,
        minStock: data.minStock,
        price: data.price,
        currency: data.currency,
        notes: data.notes,
      },
    });

    return item;
  }

  async updateInventoryItem(id: string, data: Partial<CreateInventoryItemRequest>) {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(data.sku && { sku: data.sku }),
        ...(data.name && { name: data.name }),
        ...(data.unit && { unit: data.unit }),
        ...(data.minStock !== undefined && { minStock: data.minStock }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.currency && { currency: data.currency }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return item;
  }

  async deleteInventoryItem(id: string) {
    await prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getInventoryItems(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          movements: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    // Calculate current stock for each item
    const itemsWithStock = items.map(item => {
      const totalIn = item.movements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const totalOut = item.movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const currentStock = totalIn - totalOut;
      
      return {
        ...item,
        currentStock,
        isLowStock: currentStock <= Number(item.minStock),
      };
    });

    return {
      data: itemsWithStock,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInventoryItemById(id: string) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        movements: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!item) {
      throw new Error('صنف المخزون غير موجود');
    }

    // Calculate current stock
    const totalIn = item.movements
      .filter(m => m.type === 'IN')
      .reduce((sum, m) => sum + Number(m.quantity), 0);
    
    const totalOut = item.movements
      .filter(m => m.type === 'OUT')
      .reduce((sum, m) => sum + Number(m.quantity), 0);
    
    const currentStock = totalIn - totalOut;

    return {
      ...item,
      currentStock,
      isLowStock: currentStock <= Number(item.minStock),
    };
  }

  // Inventory Movements
  async createInventoryMovement(data: CreateInventoryMovementRequest, createdBy: string) {
    const movement = await prisma.inventoryMovement.create({
      data: {
        itemId: data.itemId,
        type: data.type,
        quantity: data.quantity,
        relatedInvoiceId: data.relatedInvoiceId,
        relatedInvoiceType: data.relatedInvoiceType,
        date: new Date(data.date),
        notes: data.notes,
        createdBy,
      },
      include: {
        item: true,
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    return movement;
  }

  async getInventoryMovements(page: number = 1, limit: number = 10, itemId?: string) {
    const skip = (page - 1) * limit;

    const where = itemId ? { itemId } : {};

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          item: true,
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Statistics
  async getInventoryStats() {
    const [totalItems, lowStockItems] = await Promise.all([
      prisma.inventoryItem.count({
        where: { isActive: true },
      }),
      prisma.inventoryItem.count({
        where: {
          isActive: true,
          minStock: { gt: 0 },
        },
      }),
    ]);

    // Get low stock items details
    const items = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
        minStock: { gt: 0 },
      },
      include: {
        movements: true,
      },
    });

    const lowStockItemsDetails = items.filter(item => {
      const totalIn = item.movements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const totalOut = item.movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const currentStock = totalIn - totalOut;
      return currentStock <= Number(item.minStock);
    });

    return {
      totalItems,
      lowStockItems: lowStockItemsDetails.length,
      lowStockItemsDetails: lowStockItemsDetails.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        currentStock: item.movements
          .filter(m => m.type === 'IN')
          .reduce((sum, m) => sum + Number(m.quantity), 0) -
        item.movements
          .filter(m => m.type === 'OUT')
          .reduce((sum, m) => sum + Number(m.quantity), 0),
        minStock: Number(item.minStock),
      })),
    };
  }

  // Low Stock Alert
  async getLowStockItems() {
    const items = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
        minStock: { gt: 0 },
      },
      include: {
        movements: true,
      },
    });

    const lowStockItems = items.filter(item => {
      const totalIn = item.movements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const totalOut = item.movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const currentStock = totalIn - totalOut;
      return currentStock <= Number(item.minStock);
    });

    return lowStockItems.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      currentStock: item.movements
        .filter(m => m.type === 'IN')
        .reduce((sum, m) => sum + Number(m.quantity), 0) -
      item.movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + Number(m.quantity), 0),
      minStock: Number(item.minStock),
      unit: item.unit,
    }));
  }
}
