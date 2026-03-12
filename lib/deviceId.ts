import * as Crypto from 'expo-crypto';
import { storageService } from '~/lib/storageService';

const DEVICE_ID_KEY = 'deviceId';

let cachedDeviceId: string | null = null;

/**
 * Get or generate a persistent device ID (CSPRNG)
 * Stored in AsyncStorage/localStorage, persists across sessions
 */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  let deviceId = await storageService.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await storageService.setItem(DEVICE_ID_KEY, deviceId);
  }

  cachedDeviceId = deviceId;
  return deviceId;
}
