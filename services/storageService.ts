
import { INITIAL_DATA_KEY_PREFIX } from '../constants.ts';

export function saveData<T,>(key: string, data: T): void {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(INITIAL_DATA_KEY_PREFIX + key, serializedData);
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
  }
}

export function loadData<T,>(key: string, defaultValue: T): T {
  try {
    const serializedData = localStorage.getItem(INITIAL_DATA_KEY_PREFIX + key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error);
    return defaultValue;
  }
}

export function removeData(key: string): void {
  try {
    localStorage.removeItem(INITIAL_DATA_KEY_PREFIX + key);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
  }
}