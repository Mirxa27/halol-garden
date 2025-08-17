'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/i18n/translations';
import { getDirection, getFontFamily, formatCurrency, formatDate, formatNumber } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  dir: 'ltr' | 'rtl';
  fontFamily: string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load language from localStorage or browser preference
    const savedLang = localStorage.getItem('preferred-language') as Language;
    const browserLang = navigator.language.startsWith('ar') ? 'ar' : 'en';
    const initialLang = savedLang || browserLang;
    
    setLanguageState(initialLang);
    document.documentElement.lang = initialLang;
    document.documentElement.dir = getDirection(initialLang);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred-language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = getDirection(lang);
    
    // Set cookie for server-side rendering
    document.cookie = `preferred-language=${lang};path=/;max-age=31536000`;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    dir: getDirection(language),
    fontFamily: getFontFamily(language),
    formatCurrency: (amount, currency) => formatCurrency(amount, language, currency),
    formatDate: (date, options) => formatDate(date, language, options),
    formatNumber: (num) => formatNumber(num, language),
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}