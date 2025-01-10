import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface StorageInterface {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

class WebStorage implements StorageInterface {
  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

class MobileStorage implements StorageInterface {
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

const createStorage = (): StorageInterface => {
  console.log('Detected Platform: ', Platform.OS)
  if (Platform.OS === 'web') {
    return new WebStorage();
  }
  return new MobileStorage();
};

export const storageService = createStorage();