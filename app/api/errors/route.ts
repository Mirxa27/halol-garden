import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Error report validation schema
const errorReportSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  timestamp: z.string(),
  userAgent: z.string(),
  url: z.string(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = errorReportSchema.parse(body);

    // Get user context if available
    const userId = request.headers.get('x-user-id');
    const sessionId = request.cookies.get('session-id')?.value;

    // Log the error with full context
    logger.error('CLIENT_ERROR', {
      ...validatedData,
      userId,
      sessionId,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      referer: request.headers.get('referer'),
      source: 'error-boundary',
    });

    // In production, you might want to:
    // 1. Send to error tracking service (Sentry, etc.)
    // 2. Store in database for analysis
    // 3. Trigger alerts for critical errors

    return NextResponse.json({
      success: true,
      message: 'Error reported successfully',
    });
  } catch (error) {
    // Don't fail loudly - this is an error reporting endpoint
    console.error('Failed to log client error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to report error',
    });
  }
}