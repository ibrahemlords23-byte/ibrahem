import { Request, Response } from 'express';
import { EmployeeService } from '../services/employeeService';
import { CreateEmployeeRequest, CreateEmployeeTransactionRequest, GeneratePayrollRequest, ReportFilters } from '../types';
import { AuthRequest } from '../middleware/auth';

const employeeService = new EmployeeService();

export class EmployeeController {
  // Employees
  async createEmployee(req: AuthRequest, res: Response) {
    try {
      const employeeData: CreateEmployeeRequest = req.body;
      const employee = await employeeService.createEmployee(employeeData, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء الموظف بنجاح',
        data: employee,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateEmployee(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.id;
      const employeeData: Partial<CreateEmployeeRequest> = req.body;
      const employee = await employeeService.updateEmployee(employeeId, employeeData);
      
      res.json({
        success: true,
        message: 'تم تحديث الموظف بنجاح',
        data: employee,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteEmployee(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.id;
      await employeeService.deleteEmployee(employeeId);
      
      res.json({
        success: true,
        message: 'تم حذف الموظف بنجاح',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getEmployees(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      
      const result = await employeeService.getEmployees(page, limit, search);
      
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

  async getEmployeeById(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.id;
      const employee = await employeeService.getEmployeeById(employeeId);
      
      res.json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Employee Transactions
  async createEmployeeTransaction(req: AuthRequest, res: Response) {
    try {
      const transactionData: CreateEmployeeTransactionRequest = req.body;
      const transaction = await employeeService.createEmployeeTransaction(transactionData, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء معاملة الموظف بنجاح',
        data: transaction,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getEmployeeTransactions(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const employeeId = req.query.employeeId as string;
      
      const result = await employeeService.getEmployeeTransactions(page, limit, employeeId);
      
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

  // Payroll
  async generatePayroll(req: AuthRequest, res: Response) {
    try {
      const payrollData: GeneratePayrollRequest = req.body;
      const payroll = await employeeService.generatePayroll(payrollData, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'تم توليد كشف الراتب بنجاح',
        data: payroll,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async approvePayroll(req: AuthRequest, res: Response) {
    try {
      const payrollId = req.params.id;
      const payroll = await employeeService.approvePayroll(payrollId, req.user!.id);
      
      res.json({
        success: true,
        message: 'تم اعتماد كشف الراتب بنجاح',
        data: payroll,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getPayrolls(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters: ReportFilters = {
        employeeId: req.query.employeeId as string,
        periodMonth: req.query.periodMonth ? parseInt(req.query.periodMonth as string) : undefined,
        periodYear: req.query.periodYear ? parseInt(req.query.periodYear as string) : undefined,
      };
      
      const result = await employeeService.getPayrolls(page, limit, filters);
      
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
  async getEmployeeStats(req: AuthRequest, res: Response) {
    try {
      const stats = await employeeService.getEmployeeStats();
      
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

  // Employee Summary
  async getEmployeeSummary(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.params.id;
      const summary = await employeeService.getEmployeeSummary(employeeId);
      
      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}
