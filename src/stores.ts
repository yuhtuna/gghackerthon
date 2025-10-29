import { writable, type Writable } from 'svelte/store';

// Define the structure for our settings
export interface SearchOptions {
  synonyms: boolean;
  antonyms: boolean;
  relatedWords: boolean;
  imageSearch: boolean;
  // We'll add spellcheck here later
}

const defaultOptions: SearchOptions = {
  synonyms: true,
  antonyms: false,
  relatedWords: true,
  imageSearch: true,
};

const createPersistentStore = <T>(key: string, startValue: T): Writable<T> => {
  const { subscribe, set, update } = writable<T>(startValue);

  // Safely load the value from storage and update the store
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
      // Safely save the value to storage
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [key]: value });
      }
      set(value);
    },
    update: (updater: (value: T) => T) => {
      update((currentValue) => {
        const newValue = updater(currentValue);
        // Safely save the new value to storage
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [key]: newValue });
        }
        return newValue;
      });
    },
  };
};

export const searchOptions = createPersistentStore<SearchOptions>('findableSettings', defaultOptions);

function createToggleStore() {
  const { subscribe, update } = writable(false);

  return {
    subscribe,
    toggle: () => update(n => !n),
  };
}

export const showChat = createToggleStore();
