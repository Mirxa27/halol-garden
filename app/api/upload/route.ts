import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { uploadFile, bulkUploadFiles } from '@/lib/upload/service';

export const POST = withAuth(
  async (req: any) => {
    try {
      const formData = await req.formData();
      const files = formData.getAll('files') as File[];
      const folder = formData.get('folder') as string || 'general';
      const productId = formData.get('productId') as string | undefined;
      
      if (!files || files.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No files provided' },
          { status: 400 }
        );
      }
      
      // Single file upload
      if (files.length === 1 && files[0]) {
        const result = await uploadFile(files[0], {
          userId: req.user.id,
          ...(productId && { productId }),
          folder,
          isPublic: true
        });
        
        if (result.success) {
          return NextResponse.json({
            success: true,
            message: 'File uploaded successfully',
            data: {
              fileId: result.fileId,
              url: result.url,
              thumbnails: result.thumbnails
            }
          });
        } else {
          return NextResponse.json(
            { success: false, message: result.error },
            { status: 400 }
          );
        }
      }
      
      // Multiple files upload
      const result = await bulkUploadFiles(files, {
        userId: req.user.id,
        ...(productId && { productId }),
        folder
      });
      
      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? 'Files uploaded successfully' 
          : 'Some files failed to upload',
        data: {
          uploaded: result.uploaded,
          failed: result.failed
        }
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to upload files',
          error: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      );
    }
  },
  { requireAuth: true }
);

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false
  }
};