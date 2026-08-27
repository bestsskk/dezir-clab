import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireAdmin } from '@/lib/session';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import dns from 'dns/promises';
import net from 'net';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB Max

// Helper to check image magic bytes
function getImageExtension(buffer: Buffer, defaultExt = '.jpg'): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return '.jpg';
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return '.png';
  }
  if (buffer.length >= 6 && (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')) {
    return '.gif';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return '.webp';
  }
  if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    return '.mp4';
  }
  return defaultExt;
}

/**
 * Checks if an IP address belongs to a private, loopback, link-local, or cloud metadata range
 */
function isPrivateIp(ip: string): boolean {
  if (!ip) return true;

  // IPv4 Loopback (127.0.0.0/8)
  if (ip.startsWith('127.')) return true;

  // IPv4 Private Networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;

  // Link-local / Cloud Metadata (169.254.0.0/16, e.g. AWS 169.254.169.254)
  if (ip.startsWith('169.254.')) return true;

  // Current network (0.0.0.0/8)
  if (ip.startsWith('0.')) return true;

  // IPv6 checks
  if (ip === '::1' || ip === '::' || ip.toLowerCase().startsWith('fe80:') || ip.toLowerCase().startsWith('fc00:') || ip.toLowerCase().startsWith('fd')) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1, etc.)
  if (ip.toLowerCase().startsWith('::ffff:')) {
    const ipv4 = ip.substring(7);
    return isPrivateIp(ipv4);
  }

  return false;
}

/**
 * Validates a target URL against SSRF by resolving DNS and verifying IP addresses
 */
async function validateUrlForSsrf(targetUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error('Invalid URL format.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS protocols are allowed.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost, local domains, and AWS metadata hostname
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'instance-data'
  ) {
    throw new Error('Access to internal hostnames is prohibited.');
  }

  // If hostname is directly an IP
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('Access to private/internal network addresses is prohibited.');
    }
  } else {
    // Resolve DNS and verify all returned IP addresses
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      if (!addresses || addresses.length === 0) {
        throw new Error('Unable to resolve host.');
      }

      for (const addr of addresses) {
        if (isPrivateIp(addr.address)) {
          throw new Error('Resolved host points to a private/internal network address.');
        }
      }
    } catch (e: any) {
      throw new Error(e.message || 'DNS resolution failed for target host.');
    }
  }

  return parsed;
}

// Helper to download an actual image from URL with SSRF protection
async function fetchAndSaveImage(targetUrl: string, depth = 0): Promise<{ url: string; mediaType: string; size: number; filename: string }> {
  if (depth > 2) {
    throw new Error('Too many redirects while fetching image');
  }

  const validatedUrl = await validateUrlForSsrf(targetUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  let res: Response;
  try {
    res = await fetch(validatedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch remote source (HTTP ${res.status})`);
  }

  const contentType = res.headers.get('content-type') || '';

  // If the server returned HTML (e.g. Google Image page or Pinterest page), extract og:image or first <img>
  if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
    const html = await res.text();

    // 1. Try og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
      const extractedUrl = new URL(ogMatch[1], targetUrl).toString();
      return fetchAndSaveImage(extractedUrl, depth + 1);
    }

    // 2. Try twitter:image
    const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twitterMatch && twitterMatch[1]) {
      const extractedUrl = new URL(twitterMatch[1], targetUrl).toString();
      return fetchAndSaveImage(extractedUrl, depth + 1);
    }

    // 3. Try finding <img> src
    const imgMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      const extractedUrl = new URL(imgMatch[1], targetUrl).toString();
      return fetchAndSaveImage(extractedUrl, depth + 1);
    }

    throw new Error('The dragged link is a webpage without a direct image. Please copy the direct image link.');
  }

  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Downloaded file exceeds maximum permitted size (${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).`);
  }

  const buffer = Buffer.from(bytes);

  if (buffer.length < 100) {
    throw new Error('Downloaded file is too small or invalid.');
  }

  const isVideo = contentType.startsWith('video/');
  const ext = getImageExtension(buffer, isVideo ? '.mp4' : '.jpg');

  // Verify that it's actually an image (not HTML saved as image)
  if (!isVideo && ext === '.jpg') {
    const isActuallyHtml = buffer.toString('utf8', 0, 50).toLowerCase().includes('<html') || buffer.toString('utf8', 0, 50).toLowerCase().includes('<!doctype');
    if (isActuallyHtml) {
      throw new Error('The URL returned a web page instead of image data.');
    }
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const randomName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(uploadDir, randomName);
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${randomName}`,
    mediaType: isVideo ? 'VIDEO' : 'IMAGE',
    size: buffer.length,
    filename: `image${ext}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Only authenticated users (admins & members) can upload
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // Handle Remote Image URL (from Drag & Drop or Paste)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { imageUrl } = body;

      if (!imageUrl || typeof imageUrl !== 'string') {
        return NextResponse.json({ error: 'No imageUrl provided' }, { status: 400 });
      }

      // If it's a data: URL (base64)
      if (imageUrl.startsWith('data:image/')) {
        const matches = imageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = `.${matches[1] === 'jpeg' ? 'jpg' : matches[1]}`;
          const buffer = Buffer.from(matches[2], 'base64');
          if (buffer.length > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: 'Image exceeds maximum permitted size.' }, { status: 400 });
          }

          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          await fs.mkdir(uploadDir, { recursive: true });

          const randomName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
          const filePath = path.join(uploadDir, randomName);
          await fs.writeFile(filePath, buffer);

          return NextResponse.json({
            success: true,
            url: `/uploads/${randomName}`,
            mediaType: 'IMAGE',
            size: buffer.length,
            filename: `pasted-image${ext}`,
          });
        }
      }

      try {
        const savedResult = await fetchAndSaveImage(imageUrl.trim());
        return NextResponse.json({
          success: true,
          ...savedResult,
        });
      } catch (err: any) {
        return NextResponse.json(
          { error: err.message || 'Failed to download remote image' },
          { status: 400 }
        );
      }
    }

    // Handle Multipart Form Upload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Uploaded file exceeds maximum size limit (25MB).' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length < 50) {
      return NextResponse.json({ error: 'Uploaded file is empty or corrupted.' }, { status: 400 });
    }

    const isVideo = file.type.startsWith('video/');
    const ext = getImageExtension(buffer, path.extname(file.name) || (isVideo ? '.mp4' : '.jpg'));

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const randomName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(uploadDir, randomName);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/${randomName}`,
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
      size: file.size,
      mimeType: file.type,
      filename: file.name,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
