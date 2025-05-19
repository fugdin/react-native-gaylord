import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en';
import vi from './locales/vi';

const LANGUAGES = {
  en: {
    translation: en
  },
  vi: {
    translation: vi
  }
};

const LANG_CODES = Object.keys(LANGUAGES);

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    // Get stored language from AsyncStorage
    try {
      const storedLanguage = await AsyncStorage.getItem('user-language');
      if (storedLanguage) {
        // Return detected language
        callback(storedLanguage);
        return;
      }
    } catch (error) {
      console.log('Error reading language from AsyncStorage:', error);
    }
    
    // If no language is stored, default to Vietnamese
    callback('vi');
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      // Save selected language to AsyncStorage
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.log('Error saving language to AsyncStorage:', error);
    }
  }
};

i18n
  // Pass the i18n instance to react-i18next
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  // Initialize i18next
  .init({
    compatibilityJSON: 'v3', // To avoid errors in Android
    resources: LANGUAGES,
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    defaultNS: 'translation',
    fallbackLng: 'vi',
  });

export default i18n; 