import { Platform } from 'react-native'
import * as Device from 'expo-device'

interface DeviceInfo {
  brand: string | null
  modelName: string | null
  osName: string | null
  osVersion: string | null
  deviceType: Device.DeviceType | null
  browser: string | null
  platform: string
}

function parseBrowser(userAgent: string): string | null {
  // Order matters: Edge contains "Chrome", Chrome contains "Safari"
  if (/Edg\//i.test(userAgent)) return 'Edge'
  if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) return 'Chrome'
  if (/Firefox\//i.test(userAgent)) return 'Firefox'
  if (/Safari\//i.test(userAgent)) return 'Safari'
  return null
}

/**
 * Detect iPadOS in desktop mode.
 * Since iPadOS 13, Safari sends a macOS User-Agent, but we can detect it
 * via touch support on a "MacIntel" platform.
 */
function isIPadWeb(): boolean {
  if (typeof navigator === 'undefined') return false
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

let cachedDeviceInfoJson: string | null = null

export function getDeviceInfoJson(): string {
  if (!cachedDeviceInfoJson) {
    const isWeb = Platform.OS === 'web'

    let osName = Device.osName || null
    if (isWeb && isIPadWeb()) {
      osName = 'iPadOS'
    }

    const info: DeviceInfo = {
      brand: Device.brand,
      modelName: Device.modelName,
      osName,
      osVersion: Device.osVersion,
      deviceType: Device.deviceType,
      browser: isWeb && typeof navigator !== 'undefined' ? parseBrowser(navigator.userAgent) : null,
      platform: Platform.OS,
    }

    cachedDeviceInfoJson = JSON.stringify(info)
  }

  return cachedDeviceInfoJson
}
