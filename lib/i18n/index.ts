/**
 * Internationalization Helper Functions
 */

import { cookies } from 'next/headers';
import { translations, Language } from './translations';

const DEFAULT_LANGUAGE: Language = 'en';
const LANGUAGE_COOKIE_NAME = 'preferred-language';

/**
 * Get current language from cookies or default
 */
export async function getCurrentLanguage(): Promise<Language> {
  const cookieStore = cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);
  
  if (langCookie?.value && (langCookie.value === 'en' || langCookie.value === 'ar')) {
    return langCookie.value as Language;
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Get translations for current language
 */
export async function getTranslations(lang?: Language) {
  const language = lang || await getCurrentLanguage();
  return translations[language];
}

/**
 * Get specific translation by key path
 */
export function getTranslation(
  translations: any,
  path: string,
  params?: Record<string, string | number>
): string {
  const keys = path.split('.');
  let value = translations;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return path if translation not found
    }
  }
  
  if (typeof value !== 'string') {
    return path;
  }
  
  // Replace parameters
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      value = value.replace(`{{${key}}}`, String(val));
    });
  }
  
  return value;
}

/**
 * Format number based on locale
 */
export function formatNumber(num: number, lang: Language): string {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format currency based on locale
 */
export function formatCurrency(amount: number, lang: Language, currency = 'USD'): string {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date based on locale
 */
export function formatDate(date: Date | string, lang: Language, options?: Intl.DateTimeFormatOptions): string {
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Get text direction for language
 */
export function getDirection(lang: Language): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Get font family for language
 */
export function getFontFamily(lang: Language): string {
  return lang === 'ar' 
    ? '"Cairo", "Noto Sans Arabic", sans-serif'
    : '"Inter", "Segoe UI", sans-serif';
}