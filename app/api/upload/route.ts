import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

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

    // Save file metadata to database (optional)
    try {
      // TODO: Save file metadata to database when needed
      // await prisma.uploadedFile.create({
      //   data: {
      //     originalName: file.name,
      //     fileName: uniqueFileName,
      //     filePath: fileUrl,
      //     fileSize: file.size,
      //     fileType: file.type,
      //     category,
      //     uploadedBy: userId, // from session
      //   },
      // });
    } catch (dbError) {
      // Continue even if database save fails
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: uniqueFileName,
        originalName: file.name,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        category,
        uploadedAt: new Date().toISOString(),
      },
    });

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
    const fileName = searchParams.get('fileName');
    const category = searchParams.get('category');

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'File name is required' },
        { status: 400 }
      );
    }

    // TODO: Implement file metadata retrieval from database
    // For now, just return basic info if file exists
    const filePath = join(
      process.cwd(), 
      'public', 
      'uploads', 
      category || 'document', 
      fileName
    );

    try {
      const fs = require('fs').promises;
      const stats = await fs.stat(filePath);
      
      return NextResponse.json({
        success: true,
        data: {
          fileName,
          fileSize: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        },
      });
    } catch (fileError) {
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
    const fileName = searchParams.get('fileName');
    const category = searchParams.get('category');

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'File name is required' },
        { status: 400 }
      );
    }

    // TODO: Check user permissions to delete this file

    const filePath = join(
      process.cwd(), 
      'public', 
      'uploads', 
      category || 'document', 
      fileName
    );

    try {
      const fs = require('fs').promises;
      await fs.unlink(filePath);
      
      // TODO: Remove from database
      // await prisma.uploadedFile.delete({
      //   where: { fileName },
      // });

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (fileError) {
      return NextResponse.json(
        { success: false, error: 'File not found or already deleted' },
        { status: 404 }
      );
    }

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}