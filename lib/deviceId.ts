import { storageService } from '~/lib/storageService';

const DEVICE_ID_KEY = 'deviceId';

let cachedDeviceId: string | null = null;

/**
 * Generate a random device ID (UUID-like format without external deps)
 */
function generateDeviceId(): string {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += hex[Math.floor(Math.random() * 16)];
    if (i === 7 || i === 11 || i === 15 || i === 19) id += '-';
  }
  return id;
}

/**
 * Get or generate a persistent device ID
 * Stored in AsyncStorage/localStorage, persists across sessions
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  let deviceId = await storageService.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = generateDeviceId();
    await storageService.setItem(DEVICE_ID_KEY, deviceId);
  }

  cachedDeviceId = deviceId;
  return deviceId;
}
