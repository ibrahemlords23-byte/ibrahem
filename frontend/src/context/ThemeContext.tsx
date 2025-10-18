import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, Language } from '../types';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setPrimaryColor: (color: string) => void;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const defaultTheme: Theme = {
  mode: 'light',
  primaryColor: '#3B82F6',
};

const languages: Language[] = [
  { code: 'ar', name: 'العربية', direction: 'rtl' },
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'tr', name: 'Türkçe', direction: 'ltr' },
];

const translations = {
  ar: {
    'app.title': 'نظام إبراهيم للمحاسبة',
    'app.subtitle': 'نظام المحاسبة المتقدم',
    'login.title': 'تسجيل الدخول',
    'login.username': 'اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.submit': 'تسجيل الدخول',
    'dashboard.title': 'لوحة التحكم',
    'dashboard.welcome': 'مرحباً بك في نظام إبراهيم للمحاسبة',
    'users.title': 'إدارة المستخدمين',
    'users.add': 'إضافة جديد',
    'users.edit': 'تحديث',
    'users.delete': 'حذف',
    'users.name': 'الاسم الكامل',
    'users.email': 'البريد الإلكتروني',
    'users.phone': 'رقم الهاتف',
    'users.role': 'الدور',
    'users.status': 'الحالة',
    'users.actions': 'الإجراءات',
    'status.active': 'نشط',
    'status.inactive': 'غير نشط',
    'role.super_admin': 'مدير النظام',
    'role.admin': 'مدير',
    'role.accountant': 'محاسب',
    'role.warehouse_manager': 'مدير مستودع',
    'role.user': 'مستخدم',
    'trial.expired': 'انتهت فترة التجربة',
    'trial.days_left': 'أيام متبقية',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.search': 'بحث',
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'تم بنجاح',
  },
  en: {
    'app.title': 'Ibrahim Accounting System',
    'app.subtitle': 'Advanced Accounting System',
    'login.title': 'Login',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Login',
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to Ibrahim Accounting System',
    'users.title': 'User Management',
    'users.add': 'Add New',
    'users.edit': 'Update',
    'users.delete': 'Delete',
    'users.name': 'Full Name',
    'users.email': 'Email',
    'users.phone': 'Phone',
    'users.role': 'Role',
    'users.status': 'Status',
    'users.actions': 'Actions',
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'role.super_admin': 'Super Admin',
    'role.admin': 'Admin',
    'role.accountant': 'Accountant',
    'role.warehouse_manager': 'Warehouse Manager',
    'role.user': 'User',
    'trial.expired': 'Trial Expired',
    'trial.days_left': 'Days Left',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error occurred',
    'common.success': 'Success',
  },
  tr: {
    'app.title': 'İbrahim Muhasebe Sistemi',
    'app.subtitle': 'Gelişmiş Muhasebe Sistemi',
    'login.title': 'Giriş',
    'login.username': 'Kullanıcı Adı',
    'login.password': 'Şifre',
    'login.submit': 'Giriş',
    'dashboard.title': 'Kontrol Paneli',
    'dashboard.welcome': 'İbrahim Muhasebe Sistemine Hoş Geldiniz',
    'users.title': 'Kullanıcı Yönetimi',
    'users.add': 'Yeni Ekle',
    'users.edit': 'Güncelle',
    'users.delete': 'Sil',
    'users.name': 'Tam Ad',
    'users.email': 'E-posta',
    'users.phone': 'Telefon',
    'users.role': 'Rol',
    'users.status': 'Durum',
    'users.actions': 'İşlemler',
    'status.active': 'Aktif',
    'status.inactive': 'Pasif',
    'role.super_admin': 'Süper Yönetici',
    'role.admin': 'Yönetici',
    'role.accountant': 'Muhasebeci',
    'role.warehouse_manager': 'Depo Yöneticisi',
    'role.user': 'Kullanıcı',
    'trial.expired': 'Deneme Süresi Doldu',
    'trial.days_left': 'Kalan Gün',
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
    'common.edit': 'Düzenle',
    'common.delete': 'Sil',
    'common.search': 'Ara',
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata oluştu',
    'common.success': 'Başarılı',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(theme));
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme.mode);
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light',
    }));
  };

  const setPrimaryColor = (color: string) => {
    setTheme(prev => ({
      ...prev,
      primaryColor: color,
    }));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    const lang = saved ? JSON.parse(saved) : languages[0];
    return lang;
  });

  useEffect(() => {
    localStorage.setItem('language', JSON.stringify(language));
    
    // Apply language direction to document
    document.documentElement.setAttribute('dir', language.direction);
    document.documentElement.setAttribute('lang', language.code);
    
    if (language.direction === 'rtl') {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language.code as keyof typeof translations]?.[key as keyof typeof translations['ar']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
