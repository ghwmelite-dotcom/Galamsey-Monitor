export const runtime = 'edge';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getSessionFromRequest } from '@/lib/auth-edge';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10485760; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'video/mp4'];

function getFileType(mimeType: string): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}

export async function POST(request: Request) {
  try {
    const { env } = getRequestContext() as { env: CloudflareEnv };

    // Authentication is optional for uploads (anonymous reports allowed)
    const user = await getSessionFromRequest(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { success: false, error: 'File type not allowed. Allowed: images, PDF, MP4' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = getExtension(file.name);
    const uniqueFilename = `${uuidv4()}${ext}`;
    const key = `uploads/${uniqueFilename}`;

    // Upload to R2
    await env.STORAGE.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: user?.id || 'anonymous',
      },
    });

    // Generate URL - this would be the R2 public URL or a worker route
    // For now, we'll use a relative path that can be served via a file serving route
    const fileUrl = `/api/files/${key}`;

    // Generate thumbnail URL for images (placeholder - in production use image processing)
    let thumbnailUrl;
    if (file.type.startsWith('image/')) {
      thumbnailUrl = fileUrl; // In production, generate actual thumbnail
    }

    return Response.json({
      success: true,
      data: {
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: getFileType(file.type),
        mime_type: file.type,
        thumbnail_url: thumbnailUrl,
        uploaded_by: user?.id,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
