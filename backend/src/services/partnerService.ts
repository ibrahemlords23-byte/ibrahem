import { PrismaClient } from '@prisma/client';
import { CreatePartnerRequest } from '../types';

const prisma = new PrismaClient();

export class PartnerService {
  async createPartner(data: CreatePartnerRequest, createdBy: string) {
    const partner = await prisma.partner.create({
      data: {
        type: data.type,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
      },
    });

    return partner;
  }

  async updatePartner(id: string, data: Partial<CreatePartnerRequest>) {
    const partner = await prisma.partner.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return partner;
  }

  async deletePartner(id: string) {
    await prisma.partner.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getPartners(page: number = 1, limit: number = 10, type?: 'CUSTOMER' | 'VENDOR', search?: string) {
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(type && { type }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        skip,
        take: limit,
        include: {
          invoicesIn: {
            select: {
              id: true,
              amount: true,
              currency: true,
              date: true,
            },
            orderBy: { date: 'desc' },
            take: 5,
          },
          invoicesOut: {
            select: {
              id: true,
              amount: true,
              currency: true,
              date: true,
            },
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.partner.count({ where }),
    ]);

    // Calculate totals for each partner
    const partnersWithTotals = partners.map(partner => {
      const totalInvoicesIn = partner.invoicesIn.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
      const totalInvoicesOut = partner.invoicesOut.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
      
      return {
        ...partner,
        totalInvoicesIn,
        totalInvoicesOut,
        netAmount: totalInvoicesOut - totalInvoicesIn,
      };
    });

    return {
      data: partnersWithTotals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPartnerById(id: string) {
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        invoicesIn: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
        invoicesOut: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!partner) {
      throw new Error('الشريك غير موجود');
    }

    // Calculate totals
    const totalInvoicesIn = partner.invoicesIn.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const totalInvoicesOut = partner.invoicesOut.reduce((sum, invoice) => sum + Number(invoice.amount), 0);

    return {
      ...partner,
      totalInvoicesIn,
      totalInvoicesOut,
      netAmount: totalInvoicesOut - totalInvoicesIn,
    };
  }

  async getCustomers(page: number = 1, limit: number = 10, search?: string) {
    return this.getPartners(page, limit, 'CUSTOMER', search);
  }

  async getVendors(page: number = 1, limit: number = 10, search?: string) {
    return this.getPartners(page, limit, 'VENDOR', search);
  }

  // Statistics
  async getPartnerStats() {
    const [totalCustomers, totalVendors, activeCustomers, activeVendors] = await Promise.all([
      prisma.partner.count({
        where: { type: 'CUSTOMER', isActive: true },
      }),
      prisma.partner.count({
        where: { type: 'VENDOR', isActive: true },
      }),
      prisma.partner.count({
        where: { type: 'CUSTOMER', isActive: true },
      }),
      prisma.partner.count({
        where: { type: 'VENDOR', isActive: true },
      }),
    ]);

    return {
      totalCustomers,
      totalVendors,
      activeCustomers,
      activeVendors,
    };
  }

  // Top Customers/Vendors by Amount
  async getTopCustomers(limit: number = 10) {
    const customers = await prisma.partner.findMany({
      where: {
        type: 'CUSTOMER',
        isActive: true,
      },
      include: {
        invoicesOut: {
          select: {
            amount: true,
          },
        },
      },
    });

    const customersWithTotals = customers.map(customer => ({
      ...customer,
      totalAmount: customer.invoicesOut.reduce((sum, invoice) => sum + Number(invoice.amount), 0),
    }));

    return customersWithTotals
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  }

  async getTopVendors(limit: number = 10) {
    const vendors = await prisma.partner.findMany({
      where: {
        type: 'VENDOR',
        isActive: true,
      },
      include: {
        invoicesIn: {
          select: {
            amount: true,
          },
        },
      },
    });

    const vendorsWithTotals = vendors.map(vendor => ({
      ...vendor,
      totalAmount: vendor.invoicesIn.reduce((sum, invoice) => sum + Number(invoice.amount), 0),
    }));

    return vendorsWithTotals
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit);
  }
}
