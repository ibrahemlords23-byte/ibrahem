import { Request, Response } from 'express';
import { AuthService, UserService } from '../services/authService';
import { LoginRequest, CreateUserRequest, UpdateUserRequest } from '../types';
import { AuthRequest } from '../middleware/auth';

const authService = new AuthService();
const userService = new UserService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const credentials: LoginRequest = req.body;
      const result = await authService.login(credentials);
      
      res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        message: 'تم تحديث الرمز بنجاح',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      await authService.logout(req.user!.id);
      
      res.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export class UserController {
  async createUser(req: AuthRequest, res: Response) {
    try {
      const userData: CreateUserRequest = req.body;
      const user = await userService.createUser(userData, req.user!.id);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء المستخدم بنجاح',
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id;
      const userData: UpdateUserRequest = req.body;
      const user = await userService.updateUser(userId, userData, req.user!.id);
      
      res.json({
        success: true,
        message: 'تم تحديث المستخدم بنجاح',
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id;
      const user = await userService.deleteUser(userId, req.user!.id);
      
      res.json({
        success: true,
        message: 'تم حذف المستخدم بنجاح',
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      
      const result = await userService.getUsers(page, limit, search);
      
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

  async getUserById(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id;
      const user = await userService.getUserById(userId);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const user = await userService.getUserById(req.user!.id);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
}
