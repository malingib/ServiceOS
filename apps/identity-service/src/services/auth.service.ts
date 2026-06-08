import prisma from '@mobiwave/prisma';
import { otpService } from './otp.service';
import { generateTokens, verifyRefreshToken } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { supabase, authHelpers } from '@serviceops/supabase';
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  ConflictError,
} from '@mobiwave/shared';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const SMS_API_URL = process.env.AT_API_URL || 'https://api.africastalking.com/version1';
const SMS_API_KEY = process.env.AT_API_KEY || '';
const SMS_USERNAME = process.env.AT_USERNAME || 'sandbox';
const SMS_SENDER_ID = process.env.AT_SENDER_ID || '';

export class AuthService {
  async requestOtp(phone: string): Promise<{ expiresIn: number }> {
    const { code, expiresIn } = await otpService.generate(phone);

    try {
      const response = await fetch(`${SMS_API_URL}/messaging`, {
        method: 'POST',
        headers: {
          apiKey: SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          username: SMS_USERNAME,
          to: phone,
          message: `Your ServiceOps verification code is: ${code}. It expires in 5 minutes.`,
          from: SMS_SENDER_ID,
        }),
      });

      if (!response.ok) {
        console.error('SMS send failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('SMS send error:', error);
    }

    return { expiresIn };
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    return otpService.verify(phone, code);
  }

  async register(data: {
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
    otp: string;
    tenantId: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: { id: string; phone: string; firstName: string; lastName: string; role: string };
  }> {
    const isValidOtp = await otpService.verify(data.phone, data.otp);
    if (!isValidOtp) {
      throw new ValidationError('Invalid or expired OTP');
    }

    const existingUser = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingUser) {
      throw new ConflictError('User with this phone number already exists');
    }

    // Create user in Supabase Auth
    const { data: supabaseUser, error: supabaseError } = await authHelpers.createSupabaseUser({
      phone: data.phone,
      userMetadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        tenant_id: data.tenantId,
        role: data.role,
      },
    });

    if (supabaseError || !supabaseUser.user) {
      throw new ValidationError(`Failed to create user in Supabase: ${supabaseError?.message}`);
    }

    // Create user record in Prisma database
    const user = await prisma.user.create({
      data: {
        id: supabaseUser.user.id,
        tenantId: data.tenantId,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: 'ACTIVE',
        verifiedAt: new Date(),
        metadata: JSON.parse(JSON.stringify({ authProvider: 'supabase_phone_otp' })),
      },
    });

    if (data.role === 'CUSTOMER') {
      const referralCode = `${data.firstName.toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      await prisma.customerProfile.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          tenantId: data.tenantId,
          referralCode,
          loyaltyPoints: 0,
          referralCount: 0,
        },
      });
    }

    if (data.role === 'WORKER') {
      await prisma.workerProfile.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          tenantId: data.tenantId,
          kycStatus: 'PENDING',
          skills: [],
          reliabilityScore: 500,
          isAvailable: true,
        },
      });
    }

    const tokens = generateTokens({
      sub: user.id,
      tenant_id: user.tenantId,
      phone: user.phone,
      role: user.role,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async login(data: {
    phone: string;
    otp: string;
    tenantId: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: { id: string; phone: string; firstName: string; lastName: string; role: string };
  }> {
    const isValidOtp = await otpService.verify(data.phone, data.otp);
    if (!isValidOtp) {
      throw new ValidationError('Invalid or expired OTP');
    }

    const user = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!user || user.deletedAt) {
      throw new NotFoundError('User');
    }

    if (user.status !== 'ACTIVE') {
      throw new AuthenticationError('Account is not active');
    }

    // Verify user exists in Supabase Auth
    const supabaseUser = await authHelpers.getUserByPhone(data.phone);
    if (!supabaseUser) {
      throw new NotFoundError('User not found in authentication system');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = generateTokens({
      sub: user.id,
      tenant_id: user.tenantId,
      phone: user.phone,
      role: user.role,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      if ((decoded as any).type !== 'refresh') {
        throw new AuthenticationError('Invalid refresh token');
      }

      const isBlacklisted = await redis.get(`bl:${decoded.sub}:refresh`);
      if (isBlacklisted) {
        throw new AuthenticationError('Refresh token has been revoked');
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user || user.deletedAt || user.status !== 'ACTIVE') {
        throw new AuthenticationError('User not found or inactive');
      }

      const tokens = generateTokens({
        sub: user.id,
        tenant_id: user.tenantId,
        phone: user.phone,
        role: user.role,
      });

      await redis.setex(`bl:${decoded.sub}:refresh`, 7 * 24 * 60 * 60, '1');

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async getMe(userId: string): Promise<{
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
    avatarUrl?: string;
    status: string;
    verifiedAt?: Date;
    createdAt: Date;
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new NotFoundError('User');
    }
    return {
      id: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      email: user.email || undefined,
      avatarUrl: user.avatarUrl || undefined,
      status: user.status,
      verifiedAt: user.verifiedAt || undefined,
      createdAt: user.createdAt,
    };
  }

  async getTenants(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
    return tenant ? [tenant] : [];
  }
}

export const authService = new AuthService();
