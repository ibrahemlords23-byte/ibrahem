import { PrismaClient } from '@prisma/client';
import { CreateEmployeeRequest, CreateEmployeeTransactionRequest, GeneratePayrollRequest, ReportFilters } from '../types';

const prisma = new PrismaClient();

export class EmployeeService {
  // Employees
  async createEmployee(data: CreateEmployeeRequest, createdBy: string) {
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        baseSalary: data.baseSalary,
        currency: data.currency,
        hireDate: new Date(data.hireDate),
        status: data.status || 'ACTIVE',
        notes: data.notes,
      },
    });

    return employee;
  }

  async updateEmployee(id: string, data: Partial<CreateEmployeeRequest>) {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.baseSalary !== undefined && { baseSalary: data.baseSalary }),
        ...(data.currency && { currency: data.currency }),
        ...(data.hireDate && { hireDate: new Date(data.hireDate) }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return employee;
  }

  async deleteEmployee(id: string) {
    await prisma.employee.update({
      where: { id },
      data: { status: 'TERMINATED' },
    });
  }

  async getEmployees(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          transactions: {
            orderBy: { date: 'desc' },
            take: 5,
          },
          payrolls: {
            orderBy: [
              { periodYear: 'desc' },
              { periodMonth: 'desc' },
            ],
            take: 3,
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmployeeById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        transactions: {
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
        payrolls: {
          include: {
            approver: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
          orderBy: [
            { periodYear: 'desc' },
            { periodMonth: 'desc' },
          ],
        },
      },
    });

    if (!employee) {
      throw new Error('الموظف غير موجود');
    }

    return employee;
  }

  // Employee Transactions
  async createEmployeeTransaction(data: CreateEmployeeTransactionRequest, createdBy: string) {
    const transaction = await prisma.employeeTransaction.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        amount: data.amount,
        date: new Date(data.date),
        notes: data.notes,
        createdBy,
      },
      include: {
        employee: true,
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    return transaction;
  }

  async getEmployeeTransactions(page: number = 1, limit: number = 10, employeeId?: string) {
    const skip = (page - 1) * limit;

    const where = employeeId ? { employeeId } : {};

    const [transactions, total] = await Promise.all([
      prisma.employeeTransaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: true,
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
      prisma.employeeTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Payroll Generation
  async generatePayroll(data: GeneratePayrollRequest, createdBy: string) {
    const { employeeId, periodMonth, periodYear } = data;

    // Check if payroll already exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: {
        employeeId_periodMonth_periodYear: {
          employeeId,
          periodMonth,
          periodYear,
        },
      },
    });

    if (existingPayroll) {
      throw new Error('كشف الراتب موجود مسبقاً لهذه الفترة');
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error('الموظف غير موجود');
    }

    // Calculate period dates
    const periodStart = new Date(periodYear, periodMonth - 1, 1);
    const periodEnd = new Date(periodYear, periodMonth, 0);

    // Get transactions for the period
    const transactions = await prisma.employeeTransaction.findMany({
      where: {
        employeeId,
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    // Calculate totals
    const grossSalary = Number(employee.baseSalary);
    const totalAdvances = transactions
      .filter(t => t.type === 'ADVANCE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalAbsences = transactions
      .filter(t => t.type === 'ABSENCE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalDeductions = transactions
      .filter(t => t.type === 'DEDUCTION')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalBonuses = transactions
      .filter(t => t.type === 'BONUS')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netSalary = grossSalary + totalBonuses - totalAdvances - totalAbsences - totalDeductions;

    // Create payroll
    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        periodMonth,
        periodYear,
        grossSalary,
        totalAdvances,
        totalAbsences,
        totalDeductions,
        totalBonuses,
        netSalary,
        currency: employee.currency,
      },
      include: {
        employee: true,
      },
    });

    return payroll;
  }

  async approvePayroll(payrollId: string, approvedBy: string) {
    const payroll = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
        approver: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    return payroll;
  }

  async getPayrolls(page: number = 1, limit: number = 10, filters?: ReportFilters) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters?.periodMonth && filters?.periodYear) {
      where.periodMonth = filters.periodMonth;
      where.periodYear = filters.periodYear;
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: true,
          approver: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
        orderBy: [
          { periodYear: 'desc' },
          { periodMonth: 'desc' },
        ],
      }),
      prisma.payroll.count({ where }),
    ]);

    return {
      data: payrolls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Statistics
  async getEmployeeStats() {
    const [totalEmployees, activeEmployees, pendingPayrolls] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.payroll.count({
        where: { approvedBy: null },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      pendingPayrolls,
    };
  }

  // Employee Summary
  async getEmployeeSummary(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
        payrolls: {
          orderBy: [
            { periodYear: 'desc' },
            { periodMonth: 'desc' },
          ],
        },
      },
    });

    if (!employee) {
      throw new Error('الموظف غير موجود');
    }

    // Calculate totals
    const totalAdvances = employee.transactions
      .filter(t => t.type === 'ADVANCE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalAbsences = employee.transactions
      .filter(t => t.type === 'ABSENCE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalDeductions = employee.transactions
      .filter(t => t.type === 'DEDUCTION')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalBonuses = employee.transactions
      .filter(t => t.type === 'BONUS')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPaid = employee.payrolls
      .filter(p => p.approvedBy)
      .reduce((sum, p) => sum + Number(p.netSalary), 0);

    return {
      employee,
      summary: {
        totalAdvances,
        totalAbsences,
        totalDeductions,
        totalBonuses,
        totalPaid,
        pendingAmount: totalAdvances + totalAbsences + totalDeductions - totalBonuses,
      },
    };
  }
}
