import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../server/services/auth.service';
import { prisma } from '../../../server/config/database';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(10),
  userType: z.enum(['HEALTHCARE_PROVIDER', 'EQUIPMENT_SUPPLIER', 'MAINTENANCE_ENGINEER', 'INDIVIDUAL_CUSTOMER']),
  organizationData: z.any().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { auth } = req.query;
  const endpoint = Array.isArray(auth) ? auth[0] : auth;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (endpoint) {
      case 'login':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const loginData = loginSchema.parse(req.body);
        const loginResult = await AuthService.login(
          loginData.email,
          loginData.password,
          req.headers['user-agent'] || '',
          req.socket.remoteAddress || ''
        );

        return res.status(200).json({
          success: true,
          data: loginResult,
        });

      case 'register':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const registerData = registerSchema.parse(req.body);
        const user = await AuthService.register(registerData);

        return res.status(201).json({
          success: true,
          message: 'Registration successful. Please check your email to verify your account.',
          data: {
            userId: user.id,
            email: user.email,
          },
        });

      case 'logout':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          await AuthService.logout(token);
        }

        return res.status(200).json({
          success: true,
          message: 'Logged out successfully',
        });

      case 'refresh':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { refreshToken } = req.body;
        if (!refreshToken) {
          return res.status(400).json({ error: 'Refresh token required' });
        }

        const tokens = await AuthService.refreshToken(refreshToken);
        return res.status(200).json({
          success: true,
          data: tokens,
        });

      case 'verify-email':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { token: verifyToken } = req.body;
        if (!verifyToken) {
          return res.status(400).json({ error: 'Verification token required' });
        }

        await AuthService.verifyEmail(verifyToken);
        return res.status(200).json({
          success: true,
          message: 'Email verified successfully',
        });

      case 'forgot-password':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: 'Email required' });
        }

        await AuthService.requestPasswordReset(email);
        return res.status(200).json({
          success: true,
          message: 'Password reset instructions sent to your email',
        });

      case 'reset-password':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { token: resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) {
          return res.status(400).json({ error: 'Token and new password required' });
        }

        await AuthService.resetPassword(resetToken, newPassword);
        return res.status(200).json({
          success: true,
          message: 'Password reset successfully',
        });

      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error: any) {
    console.error('Auth API Error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}