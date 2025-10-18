import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { ApiResponse, LoginRequest, LoginResponse, User, CreateUserRequest, UpdateUserRequest, PaginatedResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('token', response.data.token);
              
              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        // Handle trial expired
        if (error.response?.data?.code === 'TRIAL_EXPIRED') {
          toast.error('انتهت فترة التجربة. يرجى التواصل مع الإدارة.');
          this.logout();
          return Promise.reject(error);
        }

        // Show error message
        const message = error.response?.data?.message || 'حدث خطأ في الخادم';
        toast.error(message);

        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    const response = await this.api.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  // User methods
  async getUsers(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await this.api.get(`/auth/users?${params}`);
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await this.api.get(`/auth/users/${id}`);
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await this.api.post('/auth/users', userData);
    return response.data;
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    const response = await this.api.put(`/auth/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse<User>> {
    const response = await this.api.delete(`/auth/users/${id}`);
    return response.data;
  }

  // Invoice methods
  async getInvoicesIn(page: number = 1, limit: number = 10, filters?: any): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo }),
      ...(filters?.currency && { currency: filters.currency }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.partnerId && { partnerId: filters.partnerId }),
    });

    const response = await this.api.get(`/invoices/in?${params}`);
    return response.data;
  }

  async getInvoiceInById(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/invoices/in/${id}`);
    return response.data;
  }

  async createInvoiceIn(data: CreateInvoiceRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post('/invoices/in', data);
    return response.data;
  }

  async updateInvoiceIn(id: string, data: UpdateInvoiceRequest): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/invoices/in/${id}`, data);
    return response.data;
  }

  async deleteInvoiceIn(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/invoices/in/${id}`);
    return response.data;
  }

  async getInvoicesOut(page: number = 1, limit: number = 10, filters?: any): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo }),
      ...(filters?.currency && { currency: filters.currency }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.partnerId && { partnerId: filters.partnerId }),
    });

    const response = await this.api.get(`/invoices/out?${params}`);
    return response.data;
  }

  async getInvoiceOutById(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/invoices/out/${id}`);
    return response.data;
  }

  async createInvoiceOut(data: CreateInvoiceRequest): Promise<ApiResponse<any>> {
    const response = await this.api.post('/invoices/out', data);
    return response.data;
  }

  async updateInvoiceOut(id: string, data: UpdateInvoiceRequest): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/invoices/out/${id}`, data);
    return response.data;
  }

  async deleteInvoiceOut(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/invoices/out/${id}`);
    return response.data;
  }

  // Inventory methods
  async getInventoryItems(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await this.api.get(`/inventory/items?${params}`);
    return response.data;
  }

  async getInventoryItemById(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/inventory/items/${id}`);
    return response.data;
  }

  async createInventoryItem(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/inventory/items', data);
    return response.data;
  }

  async updateInventoryItem(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/inventory/items/${id}`, data);
    return response.data;
  }

  async deleteInventoryItem(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/inventory/items/${id}`);
    return response.data;
  }

  async getInventoryMovements(page: number = 1, limit: number = 10, itemId?: string): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(itemId && { itemId }),
    });

    const response = await this.api.get(`/inventory/movements?${params}`);
    return response.data;
  }

  async createInventoryMovement(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/inventory/movements', data);
    return response.data;
  }

  async getInventoryStats(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/inventory/stats');
    return response.data;
  }

  async getLowStockItems(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/inventory/low-stock');
    return response.data;
  }

  // Employee methods
  async getEmployees(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await this.api.get(`/employees?${params}`);
    return response.data;
  }

  async getEmployeeById(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/employees/${id}`);
    return response.data;
  }

  async createEmployee(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/employees', data);
    return response.data;
  }

  async updateEmployee(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/employees/${id}`, data);
    return response.data;
  }

  async deleteEmployee(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/employees/${id}`);
    return response.data;
  }

  async getEmployeeTransactions(page: number = 1, limit: number = 10, employeeId?: string): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(employeeId && { employeeId }),
    });

    const response = await this.api.get(`/employees/transactions?${params}`);
    return response.data;
  }

  async createEmployeeTransaction(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/employees/transactions', data);
    return response.data;
  }

  async getPayrolls(page: number = 1, limit: number = 10, filters?: any): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.employeeId && { employeeId: filters.employeeId }),
      ...(filters?.periodMonth && { periodMonth: filters.periodMonth.toString() }),
      ...(filters?.periodYear && { periodYear: filters.periodYear.toString() }),
    });

    const response = await this.api.get(`/employees/payrolls?${params}`);
    return response.data;
  }

  async generatePayroll(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/employees/payrolls/generate', data);
    return response.data;
  }

  async approvePayroll(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/employees/payrolls/${id}/approve`);
    return response.data;
  }

  async getEmployeeStats(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/employees/stats');
    return response.data;
  }

  async getEmployeeSummary(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/employees/${id}/summary`);
    return response.data;
  }

  // Partner methods
  async getPartners(page: number = 1, limit: number = 10, type?: string, search?: string): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
      ...(search && { search }),
    });

    const response = await this.api.get(`/partners?${params}`);
    return response.data;
  }

  async getPartnerById(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/partners/${id}`);
    return response.data;
  }

  async createPartner(data: any): Promise<ApiResponse<any>> {
    const response = await this.api.post('/partners', data);
    return response.data;
  }

  async updatePartner(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await this.api.put(`/partners/${id}`, data);
    return response.data;
  }

  async deletePartner(id: string): Promise<ApiResponse<any>> {
    const response = await this.api.delete(`/partners/${id}`);
    return response.data;
  }

  async getCustomers(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await this.api.get(`/partners/customers?${params}`);
    return response.data;
  }

  async getVendors(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await this.api.get(`/partners/vendors?${params}`);
    return response.data;
  }

  async getPartnerStats(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/partners/stats');
    return response.data;
  }

  async getTopCustomers(limit: number = 10): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/partners/top/customers?limit=${limit}`);
    return response.data;
  }

  async getTopVendors(limit: number = 10): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/partners/top/vendors?limit=${limit}`);
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setAuthData(loginResponse: LoginResponse): void {
    localStorage.setItem('token', loginResponse.token);
    localStorage.setItem('refreshToken', loginResponse.refreshToken);
    localStorage.setItem('user', JSON.stringify(loginResponse.user));
  }
}

export const apiService = new ApiService();
export default apiService;
