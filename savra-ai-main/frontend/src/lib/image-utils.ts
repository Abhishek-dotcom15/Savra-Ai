/**
 * Utility functions for handling image URLs, especially R2 URLs
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Converts an R2 direct URL to a proxy URL if needed
 * This handles cases where the R2 bucket is not public
 * @param url - The image URL (can be R2 URL or already a proxy URL)
 * @returns The proxy URL or original URL if it's not an R2 URL
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '/pic.png'; // Default fallback
  
  // If it's already a proxy URL or not an R2 URL, return as-is
  if (url.includes('/api/upload/file/') || !url.includes('.r2.dev')) {
    return url;
  }
  
  // Extract the key from R2 URL format: https://pub-*.r2.dev/path/to/file
  // or https://*.r2.dev/path/to/file
  const r2UrlMatch = url.match(/https?:\/\/[^/]+\.r2\.dev\/(.+)$/);
  if (r2UrlMatch) {
    const key = r2UrlMatch[1];
    // Convert to proxy URL
    return `${API_URL}/upload/file/${key}`;
  }
  
  // If we can't parse it, return original
  return url;
}
