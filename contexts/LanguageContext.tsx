/**
 * Language Context Provider
 * Manages language state and translations for the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations = {
  en: {
    // Common
    'common.products': 'Products',
    'common.services': 'Services',
    'common.about': 'About',
    'common.contact': 'Contact',
    'common.login': 'Login',
    'common.register': 'Register',
    'common.logout': 'Logout',
    'common.dashboard': 'Dashboard',
    'common.profile': 'Profile',
    'common.settings': 'Settings',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.view': 'View',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Info',
    
    // Products
    'products.title': 'Medical Equipment',
    'products.categories': 'Categories',
    'products.featured': 'Featured Products',
    'products.new': 'New Arrivals',
    'products.bestsellers': 'Best Sellers',
    'products.price': 'Price',
    'products.availability': 'Availability',
    'products.inStock': 'In Stock',
    'products.outOfStock': 'Out of Stock',
    'products.addToCart': 'Add to Cart',
    'products.buyNow': 'Buy Now',
    'products.compare': 'Compare',
    'products.wishlist': 'Add to Wishlist',
    
    // Filters
    'filter.category': 'Category',
    'filter.priceRange': 'Price Range',
    'filter.brand': 'Brand',
    'filter.rating': 'Rating',
    'filter.availability': 'Availability',
    'filter.condition': 'Condition',
    'filter.new': 'New',
    'filter.used': 'Used',
    'filter.refurbished': 'Refurbished',
    
    // Sort
    'sort.relevance': 'Relevance',
    'sort.priceAsc': 'Price: Low to High',
    'sort.priceDesc': 'Price: High to Low',
    'sort.nameAsc': 'Name: A to Z',
    'sort.nameDesc': 'Name: Z to A',
    'sort.newest': 'Newest First',
    'sort.rating': 'Highest Rated',
  },
  ar: {
    // Common
    'common.products': 'المنتجات',
    'common.services': 'الخدمات',
    'common.about': 'حول',
    'common.contact': 'اتصل بنا',
    'common.login': 'تسجيل الدخول',
    'common.register': 'التسجيل',
    'common.logout': 'تسجيل الخروج',
    'common.dashboard': 'لوحة التحكم',
    'common.profile': 'الملف الشخصي',
    'common.settings': 'الإعدادات',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.add': 'إضافة',
    'common.view': 'عرض',
    'common.download': 'تحميل',
    'common.upload': 'رفع',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'common.warning': 'تحذير',
    'common.info': 'معلومات',
    
    // Products
    'products.title': 'المعدات الطبية',
    'products.categories': 'الفئات',
    'products.featured': 'المنتجات المميزة',
    'products.new': 'وصل حديثاً',
    'products.bestsellers': 'الأكثر مبيعاً',
    'products.price': 'السعر',
    'products.availability': 'التوفر',
    'products.inStock': 'متوفر',
    'products.outOfStock': 'غير متوفر',
    'products.addToCart': 'أضف إلى السلة',
    'products.buyNow': 'اشتر الآن',
    'products.compare': 'مقارنة',
    'products.wishlist': 'أضف إلى المفضلة',
    
    // Filters
    'filter.category': 'الفئة',
    'filter.priceRange': 'نطاق السعر',
    'filter.brand': 'العلامة التجارية',
    'filter.rating': 'التقييم',
    'filter.availability': 'التوفر',
    'filter.condition': 'الحالة',
    'filter.new': 'جديد',
    'filter.used': 'مستعمل',
    'filter.refurbished': 'مجدد',
    
    // Sort
    'sort.relevance': 'الصلة',
    'sort.priceAsc': 'السعر: من الأقل إلى الأعلى',
    'sort.priceDesc': 'السعر: من الأعلى إلى الأقل',
    'sort.nameAsc': 'الاسم: أ إلى ي',
    'sort.nameDesc': 'الاسم: ي إلى أ',
    'sort.newest': 'الأحدث أولاً',
    'sort.rating': 'الأعلى تقييماً',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguageState(savedLang);
      document.documentElement.lang = savedLang;
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations['en']];
    return translation || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;