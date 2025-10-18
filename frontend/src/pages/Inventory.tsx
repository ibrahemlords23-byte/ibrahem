import React from 'react';
import { useLanguage } from '../context/ThemeContext';

export default function Inventory() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">المستودع</h1>
        <button className="btn btn-primary">إضافة صنف مخزون</button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">صفحة إدارة المستودع - قيد التطوير</p>
      </div>
    </div>
  );
}
