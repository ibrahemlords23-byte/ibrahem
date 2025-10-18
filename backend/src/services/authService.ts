import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginRequest, LoginResponse, CreateUserRequest, UpdateUserRequest } from '../types';

const prisma = new PrismaClient();

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { username, password } = credentials;

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
        isActive: true,
      },
    });

    if (!user) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Check trial status
    if (user.isTrialActive && user.trialEndDate && new Date() > user.trialEndDate) {
      throw new Error('انتهت فترة التجربة');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        locale: user.locale,
        isTrialActive: user.isTrialActive,
        trialEndDate: user.trialEndDate,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new Error('رمز التحديث غير صالح');
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      return { token };
    } catch (error) {
      throw new Error('رمز التحديث غير صالح');
    }
  }

  async logout(userId: string): Promise<void> {
    // In a more sophisticated implementation, you might want to blacklist the token
    // For now, we'll just log the logout action
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: userId,
      },
    });
  }
}

export class UserService {
  async createUser(userData: CreateUserRequest, createdBy: string) {
    const { username, email, password, fullName, phone, role, locale } = userData;

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      throw new Error('اسم المستخدم أو البريد الإلكتروني موجود مسبقاً');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Set trial dates
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + parseInt(process.env.TRIAL_DURATION_DAYS || '30'));

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        phone,
        role: role as any,
        locale: locale || 'ar',
        trialStartDate,
        trialEndDate,
        isTrialActive: process.env.TRIAL_ENABLED === 'true',
      },
    });

    return user;
  }

  async updateUser(userId: string, userData: UpdateUserRequest, updatedBy: string) {
    const { username, email, fullName, phone, role, locale, isActive } = userData;

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                username ? { username } : {},
                email ? { email } : {},
              ].filter(Boolean),
            },
          ],
        },
      });

      if (existingUser) {
        throw new Error('اسم المستخدم أو البريد الإلكتروني موجود مسبقاً');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(role && { role: role as any }),
        ...(locale && { locale }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return user;
  }

  async deleteUser(userId: string, deletedBy: string) {
    // Don't actually delete, just deactivate
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return user;
  }

  async getUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          locale: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          isTrialActive: true,
          trialEndDate: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        locale: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        isTrialActive: true,
        trialStartDate: true,
        trialEndDate: true,
      },
    });

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    return user;
  }
}
