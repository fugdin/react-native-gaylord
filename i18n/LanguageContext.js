import React, { createContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n';

// Create the language context
export const LanguageContext = createContext({
  language: 'vi', // Default language
  setLanguage: () => {}, // Will be implemented in the provider
  isRTL: false,
});

// Create the provider component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('vi');
  const [isRTL, setIsRTL] = useState(false);

  // Effect to load the saved language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('user-language');
        if (savedLanguage) {
          changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    loadLanguage();
  }, []);

  // Function to change the language
  const changeLanguage = async (lang) => {
    // Handle RTL languages if needed in the future
    const isRightToLeft = false; // For now, both en and vi are LTR
    setIsRTL(isRightToLeft);

    // Change app's language
    i18n.changeLanguage(lang);
    
    // Update state
    setLanguageState(lang);
    
    // Save the selection to storage
    try {
      await AsyncStorage.setItem('user-language', lang);
    } catch (error) {
      console.error('Error saving language selection:', error);
    }
  };

  // Context value
  const contextValue = {
    language,
    setLanguage: changeLanguage,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider; 