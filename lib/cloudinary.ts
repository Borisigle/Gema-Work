/**
 * Extract Cloudinary public_id from a URL.
 * URL format: https://res.cloudinary.com/{cloud_name}/video/upload/{version}/{public_id}.{format}
 * or: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
 */
export function extractPublicId(url: string): string | null {
  try {
    const parts = url.split('/');
    const uploadIdx = parts.findIndex(p => p === 'upload');
    if (uploadIdx === -1) return null;

    // Everything after "upload/{version}/" is the public_id (with extension)
    const afterUpload = parts.slice(uploadIdx + 2).join('/');
    // Remove extension
    const lastDot = afterUpload.lastIndexOf('.');
    return lastDot > 0 ? afterUpload.substring(0, lastDot) : afterUpload;
  } catch {
    return null;
  }
}

/**
 * Delete a file from Cloudinary using the admin API.
 * Requires CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET env vars.
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary API keys not configured');
    return false;
  }

  const publicId = extractPublicId(url);
  if (!publicId) {
    console.error('Could not extract public_id from URL:', url);
    return false;
  }

  // Determine resource type from URL
  const resourceType = url.includes('/video/') ? 'video' : 'image';

  // Generate timestamp and signature
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

  // Simple SHA-1 signature (using Web Crypto API)
  const encoder = new TextEncoder();
  const data = encoder.encode(paramsToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('timestamp', String(timestamp));
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      { method: 'POST', body: formData }
    );
    const data = await res.json();
    return data.result === 'ok';
  } catch (err) {
    console.error('Error deleting from Cloudinary:', err);
    return false;
  }
}
