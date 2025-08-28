import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../server/config/database';

// Notification validation schemas
const notificationQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '20')),
  type: z.string().optional(),
  isRead: z.string().optional().transform(val => val === 'true'),
  sortBy: z.enum(['createdAt', 'type']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createNotificationSchema = z.object({
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  type: z.enum(['ORDER', 'PAYMENT', 'SHIPPING', 'SYSTEM', 'PROMOTION', 'SUPPORT', 'MAINTENANCE']),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.any().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
});

const markReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  markAll: z.boolean().optional().default(false),
});

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = notificationQuerySchema.parse(query);

    // Build where clause
    const where: any = { userId };

    if (validatedQuery.type) {
      where.type = validatedQuery.type;
    }

    if (validatedQuery.isRead !== undefined) {
      where.isRead = validatedQuery.isRead;
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = validatedQuery.limit;

    // Build order by
    const orderBy: any = {};
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder;

    // Fetch notifications
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedQuery.limit);
    const hasNextPage = validatedQuery.page < totalPages;
    const hasPreviousPage = validatedQuery.page > 1;

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      unreadCount,
    });

  } catch (error) {
    console.error('Notifications fetch error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true },
    });

    if (!user || !user.adminProfile) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    let targetUserIds: string[] = [];

    if (validatedData.userId) {
      targetUserIds = [validatedData.userId];
    } else if (validatedData.userIds) {
      targetUserIds = validatedData.userIds;
    } else {
      // Send to all users if no specific targets
      const allUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      targetUserIds = allUsers.map(u => u.id);
    }

    // Create notifications in batch
    const notifications = await prisma.notification.createMany({
      data: targetUserIds.map(targetUserId => ({
        userId: targetUserId,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        data: validatedData.data || {},
      })),
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'NOTIFICATION_SENT',
        entity: 'NOTIFICATION',
        newData: {
          type: validatedData.type,
          title: validatedData.title,
          recipientCount: targetUserIds.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        notificationCount: notifications.count,
        recipientCount: targetUserIds.length,
      },
      message: 'Notifications sent successfully',
    });

  } catch (error) {
    console.error('Notification creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = markReadSchema.parse(body);

    let updateWhere: any = { userId };

    if (validatedData.markAll) {
      // Mark all notifications as read
      updateWhere.isRead = false;
    } else if (validatedData.notificationIds) {
      // Mark specific notifications as read
      updateWhere.id = { in: validatedData.notificationIds };
    } else {
      return NextResponse.json(
        { success: false, error: 'Either notificationIds or markAll must be provided' },
        { status: 400 }
      );
    }

    const updateResult = await prisma.notification.updateMany({
      where: updateWhere,
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: updateResult.count,
      },
      message: 'Notifications marked as read',
    });

  } catch (error) {
    console.error('Notification update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get('ids')?.split(',');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    let deleteWhere: any = { userId };

    if (deleteAll) {
      // Delete all read notifications
      deleteWhere.isRead = true;
    } else if (notificationIds) {
      // Delete specific notifications
      deleteWhere.id = { in: notificationIds };
    } else {
      return NextResponse.json(
        { success: false, error: 'Either ids or deleteAll must be provided' },
        { status: 400 }
      );
    }

    const deleteResult = await prisma.notification.deleteMany({
      where: deleteWhere,
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleteResult.count,
      },
      message: 'Notifications deleted successfully',
    });

  } catch (error) {
    console.error('Notification deletion error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}

// Helper function to create system notification
export async function createSystemNotification(
  userIds: string[],
  type: string,
  title: string,
  message: string,
  data?: any
) {
  try {
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        data: data || {},
      })),
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
  }
}

// Helper function to create order notification
export async function createOrderNotification(
  userId: string,
  orderId: string,
  type: 'CREATED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  orderNumber: string
) {
  const titles = {
    CREATED: 'Order Created',
    CONFIRMED: 'Order Confirmed',
    SHIPPED: 'Order Shipped',
    DELIVERED: 'Order Delivered',
    CANCELLED: 'Order Cancelled',
  };

  const messages = {
    CREATED: `Your order #${orderNumber} has been created and is being processed.`,
    CONFIRMED: `Your order #${orderNumber} has been confirmed and will be shipped soon.`,
    SHIPPED: `Your order #${orderNumber} has been shipped and is on its way.`,
    DELIVERED: `Your order #${orderNumber} has been delivered successfully.`,
    CANCELLED: `Your order #${orderNumber} has been cancelled.`,
  };

  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'ORDER',
        title: titles[type],
        message: messages[type],
        data: {
          orderId,
          orderNumber,
          orderStatus: type,
        },
      },
    });
  } catch (error) {
    console.error('Error creating order notification:', error);
  }
}

// Helper function to create payment notification
export async function createPaymentNotification(
  userId: string,
  orderId: string,
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED',
  amount: number,
  orderNumber: string
) {
  const titles = {
    SUCCESS: 'Payment Successful',
    FAILED: 'Payment Failed',
    REFUNDED: 'Payment Refunded',
  };

  const messages = {
    SUCCESS: `Your payment of $${amount} for order #${orderNumber} was successful.`,
    FAILED: `Your payment for order #${orderNumber} failed. Please try again.`,
    REFUNDED: `Your payment of $${amount} for order #${orderNumber} has been refunded.`,
  };

  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'PAYMENT',
        title: titles[status],
        message: messages[status],
        data: {
          orderId,
          orderNumber,
          paymentStatus: status,
          amount,
        },
      },
    });
  } catch (error) {
    console.error('Error creating payment notification:', error);
  }
}