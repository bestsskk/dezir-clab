import { NextRequest } from 'next/server';

export const DEVICE_COOKIE_NAME = 'community_device_id';
export const DEVICE_STORAGE_KEY = 'community_device_id';
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 years

/**
 * Generates a cryptographically strong client-side device identifier
 */
function generateRandomDeviceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `dev_${crypto.randomUUID()}`;
  }
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 32; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `dev_${Date.now().toString(36)}_${rand}`;
}

/**
 * Client-Side: Retrieve or initialize persistent Device ID across localStorage & Cookies
 */
export function getOrCreateClientDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let deviceId: string | null = null;

  // 1. Try LocalStorage
  try {
    deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
  } catch (e) {
    // LocalStorage might be restricted
  }

  // 2. Try Cookie if not in localStorage
  if (!deviceId) {
    try {
      const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${DEVICE_COOKIE_NAME}=`));
      if (match) {
        deviceId = decodeURIComponent(match.split('=')[1]);
      }
    } catch (e) {}
  }

  // 3. If still no deviceId, generate a fresh unique one
  if (!deviceId || deviceId.trim().length < 8) {
    deviceId = generateRandomDeviceId();
  }

  // 4. Ensure synced in both LocalStorage & document.cookie
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
  } catch (e) {}

  try {
    document.cookie = `${DEVICE_COOKIE_NAME}=${encodeURIComponent(
      deviceId
    )}; Path=/; Max-Age=${DEVICE_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch (e) {}

  return deviceId;
}

/**
 * Client-Side: Formulate a readable device description for admins and logs
 */
export function getClientDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Unknown Device';

  try {
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    // OS detection
    if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Linux/.test(ua)) os = 'Linux';

    // Browser detection
    if (/Edg/.test(ua)) browser = 'Edge';
    else if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = 'Chrome';
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
    else if (/Firefox/.test(ua)) browser = 'Firefox';

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    const deviceType = isMobile ? 'Mobile' : 'Desktop';
    const screenRes = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '';

    return `${browser} on ${os} (${deviceType}${screenRes ? `, ${screenRes}` : ''})`;
  } catch {
    return 'Web Browser';
  }
}

/**
 * Server-Side: Extract device ID and readable info from incoming NextRequest
 */
export function extractDeviceFromRequest(
  req: NextRequest,
  body?: { deviceId?: string; deviceInfo?: string }
): { deviceId: string | null; deviceInfo: string } {
  // 1. Check direct payload
  let deviceId: string | null = body?.deviceId?.trim() || null;

  // 2. Check HTTP Header
  if (!deviceId) {
    const headerDevId = req.headers.get('x-device-id');
    if (headerDevId && headerDevId.trim().length > 0) {
      deviceId = headerDevId.trim();
    }
  }

  // 3. Check Cookie
  if (!deviceId) {
    const cookieDevId = req.cookies.get(DEVICE_COOKIE_NAME)?.value;
    if (cookieDevId && cookieDevId.trim().length > 0) {
      deviceId = cookieDevId.trim();
    }
  }

  // Determine readable device info
  const userAgent = req.headers.get('user-agent') || '';
  let deviceInfo = body?.deviceInfo?.trim() || '';

  if (!deviceInfo) {
    let os = 'Unknown OS';
    let browser = 'Browser';

    if (/iPhone|iPad|iPod/.test(userAgent)) os = 'iOS';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/Macintosh|Mac OS X/.test(userAgent)) os = 'macOS';
    else if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/Linux/.test(userAgent)) os = 'Linux';

    if (/Edg/.test(userAgent)) browser = 'Edge';
    else if (/Chrome/.test(userAgent)) browser = 'Chrome';
    else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';

    deviceInfo = `${browser} on ${os}`;
  }

  return {
    deviceId: deviceId && deviceId.length >= 6 ? deviceId : null,
    deviceInfo,
  };
}
