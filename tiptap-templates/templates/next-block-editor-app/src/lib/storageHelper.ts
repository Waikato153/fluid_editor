'use client';

class LocalStorageHelper {
  static setItem(key: string, value: any): void {
    if (typeof window === 'undefined') {
      console.error('LocalStorage is not available on the server.');
      return;
    }
    try {
      const serializedValue = JSON.stringify(value);
      window.localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
    }
  }

  static getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') {
      console.error('LocalStorage is not available on the server.');
      return null;
    }
    try {
      const serializedValue = window.localStorage.getItem(key);
      return serializedValue ? (JSON.parse(serializedValue) as T) : null;
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    if (typeof window === 'undefined') {
      console.error('LocalStorage is not available on the server.');
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') {
      console.error('LocalStorage is not available on the server.');
      return;
    }
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

export default LocalStorageHelper;
