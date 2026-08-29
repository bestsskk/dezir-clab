export const DEVICE_COOKIE_NAME = 'community_device_id';
export const DEVICE_STORAGE_KEY = 'community_device_id';
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 years

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

export function getOrCreateClientDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let deviceId: string | null = null;

  try {
    deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
  } catch (e) {}

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

  if (!deviceId || deviceId.trim().length < 8) {
    deviceId = generateRandomDeviceId();
  }

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

export function getClientDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Unknown Device';

  try {
    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Linux/.test(ua)) os = 'Linux';

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
