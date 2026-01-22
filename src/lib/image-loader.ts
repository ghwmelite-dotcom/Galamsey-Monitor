// Custom image loader for Cloudflare R2 and external images
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // If it's already a full URL, return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // For R2 storage paths (starting with /uploads/)
  if (src.startsWith('/uploads/')) {
    // In production, this would point to R2 public URL or a worker route
    // For local dev, serve from the uploads directory
    return src;
  }

  // For other local paths, return as-is
  return src;
}
