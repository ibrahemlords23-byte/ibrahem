import React from 'react';
import { useLanguage } from '../context/ThemeContext';

export default function Reports() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
        <button className="btn btn-primary">توليد تقرير</button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">صفحة التقارير - قيد التطوير</p>
      </div>
    </div>
  );
}
