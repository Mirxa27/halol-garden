import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AuthMiddleware } from '@/server/middleware/auth.middleware';
import { pusherServer } from '@/lib/pusher';

// Message validation schema
const messageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  content: z.string().min(1, 'Message content is required').max(4000, 'Message too long'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'VOICE', 'VIDEO']).default('TEXT'),
  metadata: z.record(z.any()).optional(),
  replyToId: z.string().uuid().optional(),
});

async function sendMessageHandler(request: NextRequest) {
  try {
    const user = (request as any).user;
    const body = await request.json();
    const validatedData = messageSchema.parse(body);

    const { conversationId, content, type, metadata, replyToId } = validatedData;

    // Verify conversation exists and user has access
    const conversation = await prisma.chatSession.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: user.id,
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
                profileImage: true,
                userType: true,
                status: true,
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

    // Check if conversation is active
    if (conversation.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Conversation is not active' },
        { status: 400 }
      );
    }

    // Create the message with transaction
    const message = await prisma.$transaction(async (tx) => {
      // Create message
      const newMessage = await tx.chatMessage.create({
        data: {
          sessionId: conversationId,
          senderId: user.id,
          content,
          type,
          metadata: metadata || {},
          replyToId,
        },
        include: {
          replyTo: true,
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
                      userType: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Update conversation last activity
      await tx.chatSession.update({
        where: { id: conversationId },
        data: { 
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Mark conversation as read for sender
      await tx.chatParticipant.update({
        where: {
          userId_sessionId: {
            userId: user.id,
            sessionId: conversationId,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      // Create notifications for other participants
      const otherParticipants = conversation.participants.filter(p => p.userId !== user.id);
      
      for (const participant of otherParticipants) {
        await tx.notification.create({
          data: {
            userId: participant.userId,
            type: 'NEW_MESSAGE',
            title: `New message from ${user.firstName} ${user.lastName}`,
            message: type === 'TEXT' ? content.substring(0, 100) : `Sent a ${type.toLowerCase()}`,
            data: {
              conversationId,
              messageId: newMessage.id,
              senderId: user.id,
            },
          },
        });
      }

      return newMessage;
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
      replyTo: message.replyTo,
      sender: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        userType: user.userType,
      },
    };

    // Send real-time notification via Pusher/WebSocket
    try {
      if (pusherServer) {
        await pusherServer.trigger(
          `chat-${conversationId}`,
          'new-message',
          responseMessage
        );

        // Send notification to individual users
        const otherParticipants = conversation.participants.filter(p => p.userId !== user.id);
        for (const participant of otherParticipants) {
          await pusherServer.trigger(
            `user-${participant.userId}`,
            'new-message-notification',
            {
              conversationId,
              message: responseMessage,
            }
          );
        }
      }
    } catch (pusherError) {
      console.error('Pusher notification failed:', pusherError);
      // Continue even if real-time notification fails
    }

    return NextResponse.json({
      success: true,
      data: responseMessage,
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
          { success: false, error: 'Conversation or reply message not found' },
          { status: 404 }
        );
      }
    }

    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve messages for a conversation
async function getMessagesHandler(request: NextRequest) {
  try {
    const user = (request as any).user;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const before = searchParams.get('before'); // Get messages before this timestamp

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to conversation
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        sessionId: conversationId,
        userId: user.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build where clause
    const where: any = {
      sessionId: conversationId,
      isDeleted: false,
    };

    if (before) {
      where.createdAt = {
        lt: new Date(before),
      };
    }

    // Get messages with pagination
    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            userType: true,
          },
        },
        readBy: {
          select: {
            userId: true,
            readAt: true,
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

    // Update last read timestamp for user
    await prisma.chatParticipant.update({
      where: {
        userId_sessionId: {
          userId: user.id,
          sessionId: conversationId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Mark messages as read
    const unreadMessageIds = messages
      .filter(msg => !msg.readBy.some(r => r.userId === user.id))
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessageIds.map(messageId => ({
          messageId,
          userId: user.id,
          readAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }

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
      sender: message.sender,
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        content: message.replyTo.content,
        sender: message.replyTo.sender,
      } : null,
      isRead: message.readBy.some(r => r.userId === user.id),
      readBy: message.readBy.map(r => r.userId),
    }));

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Error retrieving messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const POST = AuthMiddleware.withAuth(sendMessageHandler);
export const GET = AuthMiddleware.withAuth(getMessagesHandler);