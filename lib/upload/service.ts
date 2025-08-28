import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import prisma from '@/lib/prisma';

// File upload configuration
export interface UploadConfig {
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  uploadDir: string;
  generateThumbnails: boolean;
  thumbnailSizes: { width: number; height: number }[];
}

// Default configuration
const DEFAULT_CONFIG: UploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  uploadDir: join(process.cwd(), 'public', 'uploads'),
  generateThumbnails: true,
  thumbnailSizes: [
    { width: 150, height: 150 }, // Thumbnail
    { width: 300, height: 300 }, // Small
    { width: 600, height: 600 }, // Medium
    { width: 1200, height: 1200 } // Large
  ]
};

// Get configuration from database or use defaults
async function getUploadConfig(): Promise<UploadConfig> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['allowed_file_types', 'max_file_size']
        }
      }
    });
    
    const config = { ...DEFAULT_CONFIG };
    
    settings.forEach(setting => {
      if (setting.key === 'allowed_file_types' && setting.value) {
        const types = setting.value as string[];
        config.allowedMimeTypes = types.map(ext => {
          // Convert file extensions to mime types
          const mimeMap: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          };
          return mimeMap[ext.toLowerCase()] || ext;
        });
      } else if (setting.key === 'max_file_size' && setting.value) {
        config.maxFileSize = Number(setting.value);
      }
    });
    
    return config;
  } catch (error) {
    console.error('Error fetching upload config:', error);
    return DEFAULT_CONFIG;
  }
}

// Validate file
export async function validateFile(
  file: File | Buffer,
  mimeType: string,
  size: number,
  config?: UploadConfig
): Promise<{ valid: boolean; error?: string }> {
  const uploadConfig = config || await getUploadConfig();
  
  // Check file size
  if (size > uploadConfig.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${uploadConfig.maxFileSize / (1024 * 1024)}MB`
    };
  }
  
  // Check mime type
  if (!uploadConfig.allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not allowed`
    };
  }
  
  return { valid: true };
}

// Generate unique filename
function generateUniqueFilename(originalName: string): string {
  const ext = extname(originalName);
  const uuid = uuidv4();
  const timestamp = Date.now();
  return `${timestamp}-${uuid}${ext}`;
}

// Process image (resize, optimize)
async function processImage(
  buffer: Buffer,
  outputPath: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }
): Promise<sharp.OutputInfo> {
  const sharpInstance = sharp(buffer);
  
  if (options?.width || options?.height) {
    sharpInstance.resize(options.width, options.height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }
  
  // Convert format if specified
  if (options?.format) {
    sharpInstance.toFormat(options.format, {
      quality: options.quality || 80
    });
  }
  
  // Auto-orient based on EXIF data
  sharpInstance.rotate();
  
  return await sharpInstance.toFile(outputPath);
}

// Upload file
export async function uploadFile(
  file: File | { buffer: Buffer; originalName: string; mimeType: string },
  options?: {
    userId?: string;
    productId?: string;
    folder?: string;
    generateThumbnails?: boolean;
    isPublic?: boolean;
  }
): Promise<{
  success: boolean;
  fileId?: string;
  url?: string;
  thumbnails?: Record<string, string>;
  error?: string;
}> {
  try {
    const config = await getUploadConfig();
    
    // Extract file info
    let buffer: Buffer;
    let originalName: string;
    let mimeType: string;
    let size: number;
    
    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
      originalName = file.name;
      mimeType = file.type;
      size = file.size;
    } else {
      buffer = file.buffer;
      originalName = file.originalName;
      mimeType = file.mimeType;
      size = buffer.length;
    }
    
    // Validate file
    const validation = await validateFile(buffer, mimeType, size, config);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Generate unique filename
    const filename = generateUniqueFilename(originalName);
    
    // Determine upload directory
    const folder = options?.folder || 'general';
    const uploadDir = join(config.uploadDir, folder);
    
    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });
    
    // Full file path
    const filePath = join(uploadDir, filename);
    const relativePath = join('uploads', folder, filename);
    
    // Process and save file
    const isImage = mimeType.startsWith('image/');
    let metadata: any = {};
    const thumbnails: Record<string, string> = {};
    
    if (isImage) {
      // Process image
      const info = await processImage(buffer, filePath, {
        quality: 85,
        format: mimeType === 'image/png' ? 'png' : 'jpeg'
      });
      
      metadata = {
        width: info.width,
        height: info.height,
        format: info.format,
        size: info.size
      };
      
      // Generate thumbnails if needed
      if (options?.generateThumbnails !== false && config.generateThumbnails) {
        for (const size of config.thumbnailSizes) {
          const thumbName = `thumb_${size.width}x${size.height}_${filename}`;
          const thumbPath = join(uploadDir, thumbName);
          
          await processImage(buffer, thumbPath, {
            width: size.width,
            height: size.height,
            quality: 80
          });
          
          thumbnails[`${size.width}x${size.height}`] = join('uploads', folder, thumbName);
        }
      }
    } else {
      // Save non-image file directly
      await writeFile(filePath, buffer);
    }
    
    // Save file info to database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: filename,
        originalName,
        mimeType,
        size,
        path: relativePath,
        url: options?.isPublic ? `/${relativePath}` : undefined,
        userId: options?.userId,
        productId: options?.productId,
        metadata: {
          ...metadata,
          thumbnails,
          folder
        }
      }
    });
    
    return {
      success: true,
      fileId: uploadedFile.id,
      url: uploadedFile.url || `/${relativePath}`,
      thumbnails: Object.keys(thumbnails).length > 0 ? thumbnails : undefined
    };
    
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    };
  }
}

// Delete file
export async function deleteFile(fileId: string): Promise<boolean> {
  try {
    // Get file info from database
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    });
    
    if (!file) {
      console.error('File not found in database:', fileId);
      return false;
    }
    
    // Delete physical file
    const filePath = join(process.cwd(), 'public', file.path);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }
    
    // Delete thumbnails if they exist
    if (file.metadata && typeof file.metadata === 'object') {
      const metadata = file.metadata as any;
      if (metadata.thumbnails) {
        for (const thumbPath of Object.values(metadata.thumbnails)) {
          try {
            await unlink(join(process.cwd(), 'public', thumbPath as string));
          } catch (error) {
            console.error('Error deleting thumbnail:', error);
          }
        }
      }
    }
    
    // Delete from database
    await prisma.uploadedFile.delete({
      where: { id: fileId }
    });
    
    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
}

// Get file URL
export async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    });
    
    if (!file) return null;
    
    // Return public URL or generate signed URL for private files
    return file.url || `/${file.path}`;
  } catch (error) {
    console.error('Get file URL error:', error);
    return null;
  }
}

// Bulk upload files
export async function bulkUploadFiles(
  files: Array<File | { buffer: Buffer; originalName: string; mimeType: string }>,
  options?: {
    userId?: string;
    productId?: string;
    folder?: string;
  }
): Promise<{
  success: boolean;
  uploaded: string[];
  failed: Array<{ filename: string; error: string }>;
}> {
  const uploaded: string[] = [];
  const failed: Array<{ filename: string; error: string }> = [];
  
  for (const file of files) {
    const originalName = file instanceof File ? file.name : file.originalName;
    
    const result = await uploadFile(file, options);
    
    if (result.success && result.fileId) {
      uploaded.push(result.fileId);
    } else {
      failed.push({
        filename: originalName,
        error: result.error || 'Unknown error'
      });
    }
  }
  
  return {
    success: failed.length === 0,
    uploaded,
    failed
  };
}

// Clean up old files (for maintenance)
export async function cleanupOldFiles(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Find old files not associated with any product or user
    const oldFiles = await prisma.uploadedFile.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        productId: null,
        userId: null
      }
    });
    
    let deletedCount = 0;
    
    for (const file of oldFiles) {
      const success = await deleteFile(file.id);
      if (success) deletedCount++;
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Cleanup error:', error);
    return 0;
  }
}

// Get storage statistics
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
}> {
  try {
    const files = await prisma.uploadedFile.findMany({
      select: {
        size: true,
        mimeType: true
      }
    });
    
    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      byType: {} as Record<string, { count: number; size: number }>
    };
    
    for (const file of files) {
      stats.totalSize += file.size;
      
      const type = file.mimeType.split('/')[0];
      if (!stats.byType[type]) {
        stats.byType[type] = { count: 0, size: 0 };
      }
      stats.byType[type].count++;
      stats.byType[type].size += file.size;
    }
    
    return stats;
  } catch (error) {
    console.error('Storage stats error:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      byType: {}
    };
  }
}