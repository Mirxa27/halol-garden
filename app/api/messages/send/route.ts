import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Message validation schema
const messageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  content: z.string().min(1, 'Message content is required').max(4000, 'Message too long'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = messageSchema.parse(body);

    const { conversationId, content, type, metadata } = validatedData;
    const senderId = user.id;

    // Verify conversation exists and user has access
    const conversation = await prisma.chatSession.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: senderId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        sessionId: conversationId,
        senderId,
        content,
        type,
        metadata: metadata || {},
      },
      include: {
        session: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Update conversation last activity
    await prisma.chatSession.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Format response
    const responseMessage = {
      id: message.id,
      content: message.content,
      type: message.type,
      senderId: message.senderId,
      sessionId: message.sessionId,
      createdAt: message.createdAt,
      isEdited: message.isEdited,
      metadata: message.metadata,
      sender: conversation.participants.find(p => p.userId === senderId)?.user,
    };

    return NextResponse.json({
      success: true,
      message: responseMessage,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid message data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle Prisma errors
      if (error.message.includes('P2025')) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const userId = user.id;

    // Verify user has access to conversation
    const hasAccess = await prisma.chatParticipant.findFirst({
      where: {
        sessionId: conversationId,
        userId,
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get messages with pagination
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId: conversationId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        session: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.chatMessage.count({
      where: {
        sessionId: conversationId,
        isDeleted: false,
      },
    });

    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      type: message.type,
      senderId: message.senderId,
      sessionId: message.sessionId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isEdited: message.isEdited,
      metadata: message.metadata,
      sender: message.session.participants.find(p => p.userId === message.senderId)?.user,
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}