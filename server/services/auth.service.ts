import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { SessionManager, CacheService, CacheKeys, CacheTTL } from '../config/redis';
import { sendEmail } from './email.service';
import crypto from 'crypto';

// Define types from schema
type UserType = 'HEALTHCARE_PROVIDER' | 'EQUIPMENT_SUPPLIER' | 'MAINTENANCE_ENGINEER' | 'CUSTOMER_SERVICE' | 'ADMIN' | 'INDIVIDUAL_CUSTOMER';
type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
type VerificationStatus = 'UNVERIFIED' | 'EMAIL_VERIFIED' | 'DOCUMENTS_VERIFIED' | 'FULLY_VERIFIED';

interface TokenPayload {
  userId: string;
  email: string;
  userType: UserType;
  sessionId?: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: UserType;
  organizationDetails?: any;
}

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env['JWT_SECRET'] || 'secret';
  private static readonly JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'refresh-secret';
  private static readonly JWT_EXPIRES_IN = '1h';
  private static readonly REFRESH_EXPIRES_IN = '30d';

  /**
   * Register a new user
   */
  static async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user with transaction
    const user = await prisma.$transaction(async (tx: any) => {
      // Create base user
      const newUser = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          userType: data.userType,
          status: UserStatus.PENDING_VERIFICATION,
          verificationStatus: VerificationStatus.UNVERIFIED,
        }
      });

      // Create role-specific profile
      await this.createUserProfile(tx, newUser.id, data.userType, data.organizationDetails);

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'USER_REGISTERED',
          entityType: 'USER',
          entityId: newUser.id,
          changes: {
            userType: data.userType,
            email: data.email
          }
        }
      });

      return newUser;
    });

    // Send verification email
    const verificationToken = await this.generateVerificationToken(user.id);
    await this.sendVerificationEmail(user.email, verificationToken);

    // Cache user data
    await CacheService.set(
      `${CacheKeys.USER}${user.id}`,
      user,
      CacheTTL.MEDIUM
    );

    return {
      id: user.id,
      email: user.email,
      userType: user.userType,
      message: 'Registration successful. Please check your email to verify your account.'
    };
  }

  /**
   * Login user
   */
  static async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        healthcareProfile: true,
        supplierProfile: true,
        engineerProfile: true,
        customerServiceProfile: true,
        adminProfile: true,
        individualProfile: true,
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new Error('Account suspended. Please contact support.');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new Error('Account inactive. Please contact support.');
    }

    // Generate tokens
    const sessionId = crypto.randomBytes(32).toString('hex');
    const accessToken = this.generateAccessToken({ 
      userId: user.id, 
      email: user.email, 
      userType: user.userType,
      sessionId 
    });
    const refreshToken = this.generateRefreshToken({ 
      userId: user.id,
      sessionId 
    });

    // Create session
    const sessionData = {
      userId: user.id,
      userType: user.userType,
      loginTime: new Date(),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      refreshToken
    };

    await SessionManager.createSession(user.id, sessionData);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    });

    // Get user profile based on type
    const profile = this.getUserProfile(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        verificationStatus: user.verificationStatus,
        profile
      },
      accessToken,
      refreshToken,
      sessionId
    };
  }

  /**
   * Logout user
   */
  static async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await SessionManager.deleteSession(sessionId);
    } else {
      await SessionManager.deleteUserSessions(userId);
    }

    await CacheService.delete(`${CacheKeys.USER}${userId}`);

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_LOGOUT',
        entityType: 'USER',
        entityId: userId
      }
    });

    return { message: 'Logout successful' };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
      // Verify session exists
      const session = await SessionManager.getSession(decoded.sessionId);
      if (!session || session.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken({
        userId: user.id,
        email: user.email,
        userType: user.userType,
        sessionId: decoded.sessionId
      });

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(token: string) {
    const verificationData = await CacheService.get<{ userId: string, email: string }>(
      `email_verification:${token}`
    );

    if (!verificationData) {
      throw new Error('Invalid or expired verification token');
    }

    const user = await prisma.user.update({
      where: { id: verificationData.userId },
      data: {
        emailVerifiedAt: new Date(),
        verificationStatus: VerificationStatus.EMAIL_VERIFIED,
        status: UserStatus.ACTIVE
      }
    });

    await CacheService.delete(`email_verification:${token}`);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        entityType: 'USER',
        entityId: user.id
      }
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account exists, a password reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetData = {
      userId: user.id,
      email: user.email,
      createdAt: new Date()
    };

    await CacheService.set(
      `password_reset:${resetToken}`,
      resetData,
      3600 // 1 hour expiry
    );

    await this.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If an account exists, a password reset link has been sent.' };
  }

  /**
   * Reset password
   */
  static async resetPassword(token: string, newPassword: string) {
    const resetData = await CacheService.get<{ userId: string, email: string }>(
      `password_reset:${token}`
    );

    if (!resetData) {
      throw new Error('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: resetData.userId },
      data: { passwordHash }
    });

    await CacheService.delete(`password_reset:${token}`);

    // Invalidate all sessions
    await SessionManager.deleteUserSessions(resetData.userId);

    await prisma.auditLog.create({
      data: {
        userId: resetData.userId,
        action: 'PASSWORD_RESET',
        entityType: 'USER',
        entityId: resetData.userId
      }
    });

    return { message: 'Password reset successful' };
  }

  /**
   * Change password
   */
  static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        entityType: 'USER',
        entityId: userId
      }
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Enable two-factor authentication
   */
  static async enableTwoFactor(userId: string) {
    const secret = crypto.randomBytes(32).toString('hex');
    
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    await CacheService.set(
      `2fa_secret:${userId}`,
      secret,
      CacheTTL.PERMANENT
    );

    return { 
      secret,
      qrCode: await this.generateTwoFactorQR(userId, secret)
    };
  }

  /**
   * Verify two-factor code
   */
  static async verifyTwoFactor(userId: string, code: string): Promise<boolean> {
    // Implementation would depend on the 2FA library used
    // This is a placeholder
    return true;
  }

  // Helper methods

  private static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, { 
      expiresIn: this.JWT_EXPIRES_IN 
    });
  }

  private static generateRefreshToken(payload: any): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, { 
      expiresIn: this.REFRESH_EXPIRES_IN 
    });
  }

  private static async generateVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    await CacheService.set(
      `email_verification:${token}`,
      { userId, email: user?.email },
      86400 // 24 hours
    );

    return token;
  }

  private static async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Medical Marketplace',
      html: `
        <h1>Welcome to Medical Marketplace</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link: ${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `
    });
  }

  private static async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: 'Password Reset - Medical Marketplace',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy and paste this link: ${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
  }

  private static async createUserProfile(tx: any, userId: string, userType: UserType, details?: any) {
    switch (userType) {
      case UserType.HEALTHCARE_PROVIDER:
        await tx.healthcareProvider.create({
          data: {
            userId,
            organizationName: details?.organizationName || '',
            organizationType: details?.organizationType || 'clinic',
            licenseNumber: details?.licenseNumber || '',
            address: details?.address || {},
            specializations: details?.specializations || [],
            accreditations: details?.accreditations || [],
            contactPersons: details?.contactPersons || [],
            operatingHours: details?.operatingHours || {}
          }
        });
        break;

      case UserType.EQUIPMENT_SUPPLIER:
        await tx.equipmentSupplier.create({
          data: {
            userId,
            companyName: details?.companyName || '',
            businessRegistrationNumber: details?.businessRegistrationNumber || '',
            taxRegistrationNumber: details?.taxRegistrationNumber || '',
            yearEstablished: details?.yearEstablished || new Date().getFullYear(),
            returnPolicy: details?.returnPolicy || '',
            warrantyTerms: details?.warrantyTerms || '',
            address: details?.address || {},
            warehouseLocations: details?.warehouseLocations || [],
            productCategories: details?.productCategories || [],
            brands: details?.brands || [],
            certifications: details?.certifications || [],
            bankDetails: details?.bankDetails || {},
            deliveryCapabilities: details?.deliveryCapabilities || {}
          }
        });
        break;

      case UserType.MAINTENANCE_ENGINEER:
        await tx.maintenanceEngineer.create({
          data: {
            userId,
            isFreelancer: details?.isFreelancer ?? true,
            licenseNumber: details?.licenseNumber || '',
            experienceYears: details?.experienceYears || 0,
            specializations: details?.specializations || [],
            certifications: details?.certifications || [],
            serviceAreas: details?.serviceAreas || [],
            availability: details?.availability || {},
            toolsAndEquipment: details?.toolsAndEquipment || []
          }
        });
        break;

      case UserType.CUSTOMER_SERVICE:
        await tx.customerServiceProfile.create({
          data: {
            userId,
            employeeId: details?.employeeId || '',
            department: details?.department || 'Support',
            languages: details?.languages || ['en'],
            specializations: details?.specializations || [],
            shiftSchedule: details?.shiftSchedule || {}
          }
        });
        break;

      case UserType.ADMIN:
        await tx.adminProfile.create({
          data: {
            userId,
            employeeId: details?.employeeId || '',
            department: details?.department || 'Administration',
            accessLevel: details?.accessLevel || 'admin',
            permissions: details?.permissions || [],
            managedRegions: details?.managedRegions || [],
            managedCategories: details?.managedCategories || []
          }
        });
        break;

      case UserType.INDIVIDUAL_CUSTOMER:
        await tx.individualCustomer.create({
          data: {
            userId,
            address: details?.address || {}
          }
        });
        break;
    }
  }

  private static getUserProfile(user: any) {
    switch (user.userType) {
      case UserType.HEALTHCARE_PROVIDER:
        return user.healthcareProfile;
      case UserType.EQUIPMENT_SUPPLIER:
        return user.supplierProfile;
      case UserType.MAINTENANCE_ENGINEER:
        return user.engineerProfile;
      case UserType.CUSTOMER_SERVICE:
        return user.customerServiceProfile;
      case UserType.ADMIN:
        return user.adminProfile;
      case UserType.INDIVIDUAL_CUSTOMER:
        return user.individualProfile;
      default:
        return null;
    }
  }

  private static async generateTwoFactorQR(userId: string, secret: string): Promise<string> {
    // This would generate a QR code for 2FA apps
    // Implementation depends on the library used
    return `otpauth://totp/MedicalMarketplace:${userId}?secret=${secret}`;
  }
}

export default AuthService;