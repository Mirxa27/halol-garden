import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// File validation schema
const fileUploadSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().max(10 * 1024 * 1024), // 10MB max
  fileType: z.string().regex(/^(image|application|text)\/.*$/),
  category: z.enum(['product', 'profile', 'document', 'message']).default('document'),
});

const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  text: ['text/plain', 'text/csv'],
  application: ['application/json', 'application/xml'],
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'document';
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = fileUploadSchema.safeParse({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      category,
    });

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid file', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if file type is allowed
    const fileCategory = file.type.split('/')[0];
    const allowedTypes = ALLOWED_FILE_TYPES[fileCategory as keyof typeof ALLOWED_FILE_TYPES];
    
    if (!allowedTypes || !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${timestamp}_${randomId}.${fileExtension}`;

    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'public', 'uploads', category);
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filePath = join(uploadDir, uniqueFileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Generate public URL
    const fileUrl = `/uploads/${category}/${uniqueFileName}`;

    // Save file metadata to database
    try {
      const uploadedFile = await prisma.uploadedFile.create({
        data: {
          fileName,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          path: filePath,
          url: `/uploads/${fileName}`,
          uploadedBy: request.headers.get('x-user-id') || undefined,
          userId: request.headers.get('x-user-id') || undefined,
          productId: productId || undefined,
          metadata: {
            uploadedAt: new Date().toISOString(),
            source: 'api',
          },
        },
      });

      return NextResponse.json({
        success: true,
        file: {
          id: uploadedFile.id,
          fileName: uploadedFile.fileName,
          originalName: uploadedFile.originalName,
          size: uploadedFile.size,
          type: uploadedFile.mimeType,
          url: uploadedFile.url,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // File was uploaded successfully, return success even if DB save failed
      return NextResponse.json({
        success: true,
        file: {
          fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: `/uploads/${fileName}`,
        },
        warning: 'File uploaded but metadata not saved to database',
      });
    }

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOSPC')) {
        return NextResponse.json(
          { success: false, error: 'Not enough storage space' },
          { status: 507 }
        );
      }
      
      if (error.message.includes('EACCES')) {
        return NextResponse.json(
          { success: false, error: 'Permission denied' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'File upload failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve file metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'File name is required' },
        { status: 400 }
      );
    }

    // Try to get file metadata from database first
    const fileRecord = await prisma.uploadedFile.findFirst({
      where: { fileName },
    });

    if (fileRecord) {
      return NextResponse.json({
        success: true,
        file: {
          id: fileRecord.id,
          fileName: fileRecord.fileName,
          originalName: fileRecord.originalName,
          size: fileRecord.size,
          type: fileRecord.mimeType,
          url: fileRecord.url,
          uploadedAt: fileRecord.createdAt,
          uploadedBy: fileRecord.uploadedBy,
        },
      });
    }

    // Fallback to checking if file exists on disk
    const filePath = join(
      process.cwd(),
      'public',
      'uploads',
      fileName
    );

    try {
      const stats = await stat(filePath);
      return NextResponse.json({
        success: true,
        file: {
          fileName,
          size: stats.size,
          url: `/uploads/${fileName}`,
          lastModified: stats.mtime,
        },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve file information' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove files
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'File name is required' },
        { status: 400 }
      );
    }

    // Check user permissions
    const userId = request.headers.get('x-user-id');
    if (userId) {
      const fileRecord = await prisma.uploadedFile.findFirst({
        where: { fileName },
      });

      if (fileRecord && fileRecord.userId !== userId) {
        // Check if user is admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { userType: true },
        });

        if (user?.userType !== 'ADMIN') {
          return NextResponse.json(
            { success: false, error: 'Unauthorized to delete this file' },
            { status: 403 }
          );
        }
      }
    }

    const filePath = join(
      process.cwd(),
      'public',
      'uploads',
      fileName
    );

    try {
      await unlink(filePath);
      
      // Remove from database
      await prisma.uploadedFile.deleteMany({
        where: { fileName },
      });

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // File doesn't exist on disk, try to clean up database
        await prisma.uploadedFile.deleteMany({
          where: { fileName },
        });

        return NextResponse.json(
          { success: false, error: 'File not found' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}