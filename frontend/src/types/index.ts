export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  locale: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  isTrialActive: boolean;
  trialEndDate?: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'WAREHOUSE_MANAGER' | 'USER';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  locale?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: UserRole;
  locale?: string;
  isActive?: boolean;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

export interface Partner {
  id: string;
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  partnerId?: string;
  category?: string;
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  partner?: Partner;
  creator?: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  minStock: number;
  price: number;
  currency: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentStock?: number;
  isLowStock?: boolean;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  relatedInvoiceId?: string;
  relatedInvoiceType?: 'IN' | 'OUT';
  date: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  item?: InventoryItem;
  creator?: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface Employee {
  id: string;
  name: string;
  baseSalary: number;
  currency: string;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeTransaction {
  id: string;
  employeeId: string;
  type: 'ADVANCE' | 'ABSENCE' | 'DEDUCTION' | 'BONUS' | 'SALARY';
  amount: number;
  date: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  employee?: Employee;
  creator?: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface Payroll {
  id: string;
  employeeId: string;
  periodMonth: number;
  periodYear: number;
  grossSalary: number;
  totalAdvances: number;
  totalAbsences: number;
  totalDeductions: number;
  totalBonuses: number;
  netSalary: number;
  currency: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  approver?: {
    id: string;
    username: string;
    fullName: string;
  };
}

export interface DashboardStats {
  totalInvoicesIn: number;
  totalInvoicesOut: number;
  totalInvoicesInAmount: number;
  totalInvoicesOutAmount: number;
  totalEmployees: number;
  totalInventoryItems: number;
  lowStockItems: number;
  pendingPayrolls: number;
  currencyBreakdown: {
    currency: string;
    amount: number;
  }[];
}

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  category?: string;
  partnerId?: string;
  employeeId?: string;
  periodMonth?: number;
  periodYear?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
}

export interface Language {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}
