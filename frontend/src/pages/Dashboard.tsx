import React from 'react';
import { useQuery } from 'react-query';
import { useLanguage } from '../context/ThemeContext';
import apiService from '../services/api';
import {
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { t } = useLanguage();

  const { data: stats, isLoading } = useQuery(
    'dashboard-stats',
    () => apiService.getDashboardStats(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const dashboardData = stats?.data || {
    totalInvoicesIn: 0,
    totalInvoicesOut: 0,
    totalInvoicesInAmount: 0,
    totalInvoicesOutAmount: 0,
    totalEmployees: 0,
    totalInventoryItems: 0,
    lowStockItems: 0,
    pendingPayrolls: 0,
    currencyBreakdown: [],
  };

  const statCards = [
    {
      name: 'إجمالي الواردات',
      value: dashboardData.totalInvoicesIn,
      amount: dashboardData.totalInvoicesInAmount,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      name: 'إجمالي الصادرات',
      value: dashboardData.totalInvoicesOut,
      amount: dashboardData.totalInvoicesOutAmount,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      name: 'الموظفين',
      value: dashboardData.totalEmployees,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
    {
      name: 'أصناف المخزون',
      value: dashboardData.totalInventoryItems,
      icon: ArchiveBoxIcon,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
    {
      name: 'أصناف منخفضة المخزون',
      value: dashboardData.lowStockItems,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
    },
    {
      name: 'كشوف رواتب معلقة',
      value: dashboardData.pendingPayrolls,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-lg font-medium text-gray-900 mb-2">
            {t('dashboard.welcome')}
          </h1>
          <p className="text-sm text-gray-600">
            مرحباً بك في نظام إبراهيم للمحاسبة المتقدم. يمكنك من هنا مراقبة جميع العمليات المالية والمخزون والموظفين.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {card.value.toLocaleString()}
                      </div>
                      {card.amount !== undefined && (
                        <div className={`ml-2 text-sm font-medium ${card.textColor}`}>
                          {card.amount.toLocaleString()} ل.س
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Currency breakdown */}
      {dashboardData.currencyBreakdown.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              توزيع المبالغ حسب العملة
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dashboardData.currencyBreakdown.map((currency) => (
                <div key={currency.currency} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {currency.currency}
                    </span>
                    <span className="text-lg font-semibold text-blue-600">
                      {currency.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            الإجراءات السريعة
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button className="btn btn-primary btn-sm">
              إضافة فاتورة وارد
            </button>
            <button className="btn btn-primary btn-sm">
              إضافة فاتورة صادر
            </button>
            <button className="btn btn-secondary btn-sm">
              إضافة صنف مخزون
            </button>
            <button className="btn btn-secondary btn-sm">
              إضافة موظف
            </button>
          </div>
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            النشاط الأخير
          </h3>
          <div className="text-center py-8">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد أنشطة حديثة</h3>
            <p className="mt-1 text-sm text-gray-500">
              سيتم عرض آخر العمليات هنا عند إضافة بيانات جديدة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
