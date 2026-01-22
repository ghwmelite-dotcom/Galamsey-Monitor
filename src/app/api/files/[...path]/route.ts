import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { env } = getRequestContext() as { env: CloudflareEnv };
    const { path } = await params;
    const key = path.join('/');

    // Get the file from R2
    const object = await env.STORAGE.get(key);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    // Get content type from R2 metadata or default to octet-stream
    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';

    // Return the file with appropriate headers
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.httpEtag,
      },
    });
  } catch (error) {
    console.error('File serving error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
