export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    role: string;
    locale: string;
    isTrialActive: boolean;
    trialEndDate?: Date;
  };
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: string;
  locale?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  locale?: string;
  isActive?: boolean;
}

export interface CreateInvoiceRequest {
  amount: number;
  currency: string;
  description?: string;
  date: string;
  partnerId?: string;
  category?: string;
  attachments?: string[];
}

export interface UpdateInvoiceRequest {
  amount?: number;
  currency?: string;
  description?: string;
  date?: string;
  partnerId?: string;
  category?: string;
  attachments?: string[];
}

export interface CreatePartnerRequest {
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface CreateInventoryItemRequest {
  sku: string;
  name: string;
  unit: string;
  minStock: number;
  price: number;
  currency: string;
  notes?: string;
}

export interface CreateInventoryMovementRequest {
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  relatedInvoiceId?: string;
  relatedInvoiceType?: 'IN' | 'OUT';
  date: string;
  notes?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  baseSalary: number;
  currency: string;
  hireDate: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  notes?: string;
}

export interface CreateEmployeeTransactionRequest {
  employeeId: string;
  type: 'ADVANCE' | 'ABSENCE' | 'DEDUCTION' | 'BONUS' | 'SALARY';
  amount: number;
  date: string;
  notes?: string;
}

export interface GeneratePayrollRequest {
  employeeId: string;
  periodMonth: number;
  periodYear: number;
}

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  category?: string;
  partnerId?: string;
  employeeId?: string;
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
