import { writable, type Writable } from 'svelte/store';

// Define the structure for our settings
export type SearchMode = 'find' | 'basic' | 'deep';

export interface AppSettings {
  searchMode: SearchMode;
}

const defaultSettings: AppSettings = {
  searchMode: 'basic', // 'basic' is the new default mode
};

const createPersistentStore = <T>(key: string, startValue: T): Writable<T> => {
  const { subscribe, set, update } = writable<T>(startValue);

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(key).then(value => {
      if (value && value[key] !== undefined) {
        set(value[key]);
      }
    });
  }

  return {
    subscribe,
    set: (value: T) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [key]: value });
      }
      set(value);
    },
    update: (updater: (value: T) => T) => {
      update((currentValue) => {
        const newValue = updater(currentValue);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [key]: newValue });
        }
        return newValue;
      });
    },
  };
};

export const appSettings = createPersistentStore<AppSettings>('findableSettings', defaultSettings);