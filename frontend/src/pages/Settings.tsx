import React from 'react';
import { useLanguage } from '../context/ThemeContext';

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">صفحة الإعدادات - قيد التطوير</p>
      </div>
    </div>
  );
}
