import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import { body } from 'express-validator';

const router = Router();
const employeeController = new EmployeeController();

// Employees
router.get('/',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  employeeController.getEmployees
);

router.get('/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  employeeController.getEmployeeById
);

router.post('/',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  [
    body('name').notEmpty().withMessage('اسم الموظف مطلوب'),
    body('baseSalary').isNumeric().withMessage('الراتب الأساسي يجب أن يكون رقماً'),
    body('currency').notEmpty().withMessage('العملة مطلوبة'),
    body('hireDate').isISO8601().withMessage('تاريخ التوظيف غير صحيح'),
  ],
  employeeController.createEmployee
);

router.put('/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  [
    body('name').optional().notEmpty().withMessage('اسم الموظف مطلوب'),
    body('baseSalary').optional().isNumeric().withMessage('الراتب الأساسي يجب أن يكون رقماً'),
    body('currency').optional().notEmpty().withMessage('العملة مطلوبة'),
    body('hireDate').optional().isISO8601().withMessage('تاريخ التوظيف غير صحيح'),
  ],
  employeeController.updateEmployee
);

router.delete('/:id',
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  employeeController.deleteEmployee
);

// Employee Transactions
router.get('/:id/transactions',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  employeeController.getEmployeeTransactions
);

router.post('/transactions',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  [
    body('employeeId').notEmpty().withMessage('معرف الموظف مطلوب'),
    body('type').isIn(['ADVANCE', 'ABSENCE', 'DEDUCTION', 'BONUS', 'SALARY']).withMessage('نوع المعاملة غير صحيح'),
    body('amount').isNumeric().withMessage('المبلغ يجب أن يكون رقماً'),
    body('date').isISO8601().withMessage('التاريخ غير صحيح'),
  ],
  employeeController.createEmployeeTransaction
);

// Payroll
router.get('/payrolls',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  employeeController.getPayrolls
);

router.post('/payrolls/generate',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  [
    body('employeeId').notEmpty().withMessage('معرف الموظف مطلوب'),
    body('periodMonth').isInt({ min: 1, max: 12 }).withMessage('الشهر يجب أن يكون بين 1 و 12'),
    body('periodYear').isInt({ min: 2020, max: 2030 }).withMessage('السنة غير صحيحة'),
  ],
  employeeController.generatePayroll
);

router.put('/payrolls/:id/approve',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  employeeController.approvePayroll
);

// Statistics
router.get('/stats',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  employeeController.getEmployeeStats
);

// Employee Summary
router.get('/:id/summary',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']),
  employeeController.getEmployeeSummary
);

export default router;
