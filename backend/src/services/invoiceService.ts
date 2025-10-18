import { PrismaClient } from '@prisma/client';
import { CreateInvoiceRequest, UpdateInvoiceRequest, ReportFilters } from '../types';

const prisma = new PrismaClient();

export class InvoiceService {
  // Invoices In (الواردات)
  async createInvoiceIn(data: CreateInvoiceRequest, createdBy: string) {
    const invoice = await prisma.invoiceIn.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        date: new Date(data.date),
        vendorId: data.partnerId,
        category: data.category,
        attachments: data.attachments || [],
        createdBy,
      },
      include: {
        vendor: true,
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    return invoice;
  }

  async updateInvoiceIn(id: string, data: UpdateInvoiceRequest, updatedBy: string) {
    const invoice = await prisma.invoiceIn.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.currency && { currency: data.currency }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.partnerId !== undefined && { vendorId: data.partnerId }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.attachments !== undefined && { attachments: data.attachments }),
      },
      include: {
        vendor: true,
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    return invoice;
  }

  async deleteInvoiceIn(id: string) {
    await prisma.invoiceIn.delete({
      where: { id },
    });
  }

  async getInvoicesIn(page: number = 1, limit: number = 10, filters?: ReportFilters) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.dateFrom && filters?.dateTo) {
      where.date = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo),
      };
    }

    if (filters?.currency) {
      where.currency = filters.currency;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.partnerId) {
      where.vendorId = filters.partnerId;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoiceIn.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: true,
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.invoiceIn.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoiceInById(id: string) {
    const invoice = await prisma.invoiceIn.findUnique({
      where: { id },
      include: {
        vendor: true,
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        movements: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('فاتورة الوارد غير موجودة');
    }

    return invoice;
  }

  // Invoices Out (الصادرات)
  async createInvoiceOut(data: CreateInvoiceRequest, createdBy: string) {
    const invoice = await prisma.invoiceOut.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        date: new Date(data.date),
        customerId: data.partnerId,
        category: data.category,
        attachments: data.attachments || [],
        createdBy,
      },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    return invoice;
  }

  async updateInvoiceOut(id: string, data: UpdateInvoiceRequest, updatedBy: string) {
    const invoice = await prisma.invoiceOut.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.currency && { currency: data.currency }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.partnerId !== undefined && { customerId: data.partnerId }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.attachments !== undefined && { attachments: data.attachments }),
      },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    return invoice;
  }

  async deleteInvoiceOut(id: string) {
    await prisma.invoiceOut.delete({
      where: { id },
    });
  }

  async getInvoicesOut(page: number = 1, limit: number = 10, filters?: ReportFilters) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.dateFrom && filters?.dateTo) {
      where.date = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo),
      };
    }

    if (filters?.currency) {
      where.currency = filters.currency;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.partnerId) {
      where.customerId = filters.partnerId;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoiceOut.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.invoiceOut.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoiceOutById(id: string) {
    const invoice = await prisma.invoiceOut.findUnique({
      where: { id },
      include: {
        customer: true,
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        movements: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('فاتورة الصادر غير موجودة');
    }

    return invoice;
  }

  // Statistics
  async getInvoiceStats(filters?: ReportFilters) {
    const whereIn: any = {};
    const whereOut: any = {};

    if (filters?.dateFrom && filters?.dateTo) {
      const dateFilter = {
        gte: new Date(filters.dateFrom),
        lte: new Date(filters.dateTo),
      };
      whereIn.date = dateFilter;
      whereOut.date = dateFilter;
    }

    if (filters?.currency) {
      whereIn.currency = filters.currency;
      whereOut.currency = filters.currency;
    }

    const [invoicesInStats, invoicesOutStats] = await Promise.all([
      prisma.invoiceIn.aggregate({
        where: whereIn,
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.invoiceOut.aggregate({
        where: whereOut,
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    return {
      invoicesIn: {
        count: invoicesInStats._count.id,
        totalAmount: Number(invoicesInStats._sum.amount || 0),
      },
      invoicesOut: {
        count: invoicesOutStats._count.id,
        totalAmount: Number(invoicesOutStats._sum.amount || 0),
      },
      netAmount: Number(invoicesOutStats._sum.amount || 0) - Number(invoicesInStats._sum.amount || 0),
    };
  }
}
