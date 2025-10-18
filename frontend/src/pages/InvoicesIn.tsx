import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useLanguage } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { CreateInvoiceRequest, ReportFilters } from '../types';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function InvoicesIn() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data: invoicesData, isLoading } = useQuery(
    ['invoices-in', searchTerm, filters],
    () => apiService.getInvoicesIn(1, 50, filters),
    {
      keepPreviousData: true,
    }
  );

  const createInvoiceMutation = useMutation(
    (invoiceData: CreateInvoiceRequest) => apiService.createInvoiceIn(invoiceData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices-in');
        setIsCreateModalOpen(false);
        toast.success('تم إنشاء فاتورة الوارد بنجاح');
      },
      onError: (error: any) => {
        toast.error(error.message || 'فشل في إنشاء فاتورة الوارد');
      },
    }
  );

  const updateInvoiceMutation = useMutation(
    ({ id, invoiceData }: { id: string; invoiceData: Partial<CreateInvoiceRequest> }) =>
      apiService.updateInvoiceIn(id, invoiceData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices-in');
        setIsEditModalOpen(false);
        toast.success('تم تحديث فاتورة الوارد بنجاح');
      },
      onError: (error: any) => {
        toast.error(error.message || 'فشل في تحديث فاتورة الوارد');
      },
    }
  );

  const deleteInvoiceMutation = useMutation(
    (id: string) => apiService.deleteInvoiceIn(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices-in');
        toast.success('تم حذف فاتورة الوارد بنجاح');
      },
      onError: (error: any) => {
        toast.error(error.message || 'فشل في حذف فاتورة الوارد');
      },
    }
  );

  const handleCreateInvoice = (data: CreateInvoiceRequest) => {
    createInvoiceMutation.mutate(data);
  };

  const handleUpdateInvoice = (data: Partial<CreateInvoiceRequest>) => {
    if (selectedInvoice) {
      updateInvoiceMutation.mutate({ id: selectedInvoice.id, invoiceData: data });
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      deleteInvoiceMutation.mutate(id);
    }
  };

  const canManageInvoices = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">الواردات</h1>
        {canManageInvoices && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            إضافة فاتورة وارد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">من تاريخ</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="form-label">إلى تاريخ</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="form-label">العملة</label>
            <select
              value={filters.currency || ''}
              onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
              className="input"
            >
              <option value="">جميع العملات</option>
              <option value="SYP">ليرة سورية</option>
              <option value="TRY">ليرة تركية</option>
              <option value="USD">دولار أمريكي</option>
            </select>
          </div>
          <div>
            <label className="form-label">البحث</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الفواتير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المبلغ</th>
                  <th>العملة</th>
                  <th>البيان</th>
                  <th>المورد</th>
                  <th>التصنيف</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {invoicesData?.data.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{new Date(invoice.date).toLocaleDateString('ar-SA')}</td>
                    <td className="font-medium">{Number(invoice.amount).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-info">{invoice.currency}</span>
                    </td>
                    <td>{invoice.description || '-'}</td>
                    <td>{invoice.vendor?.name || '-'}</td>
                    <td>{invoice.category || '-'}</td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsViewModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {canManageInvoices && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsEditModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <CreateInvoiceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateInvoice}
          isLoading={createInvoiceMutation.isLoading}
          type="in"
        />
      )}

      {/* Edit Invoice Modal */}
      {isEditModalOpen && selectedInvoice && (
        <EditInvoiceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateInvoice}
          invoice={selectedInvoice}
          isLoading={updateInvoiceMutation.isLoading}
          type="in"
        />
      )}

      {/* View Invoice Modal */}
      {isViewModalOpen && selectedInvoice && (
        <ViewInvoiceModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          invoice={selectedInvoice}
          type="in"
        />
      )}
    </div>
  );
}

// Create Invoice Modal Component
function CreateInvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInvoiceRequest) => void;
  isLoading: boolean;
  type: 'in' | 'out';
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateInvoiceRequest>();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                إضافة فاتورة {type === 'in' ? 'وارد' : 'صادر'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">المبلغ</label>
                  <input
                    {...register('amount', { 
                      required: 'المبلغ مطلوب',
                      valueAsNumber: true
                    })}
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="المبلغ"
                  />
                  {errors.amount && <p className="form-error">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="form-label">العملة</label>
                  <select
                    {...register('currency', { required: 'العملة مطلوبة' })}
                    className="input"
                  >
                    <option value="">اختر العملة</option>
                    <option value="SYP">ليرة سورية</option>
                    <option value="TRY">ليرة تركية</option>
                    <option value="USD">دولار أمريكي</option>
                  </select>
                  {errors.currency && <p className="form-error">{errors.currency.message}</p>}
                </div>
                <div>
                  <label className="form-label">التاريخ</label>
                  <input
                    {...register('date', { required: 'التاريخ مطلوب' })}
                    type="date"
                    className="input"
                  />
                  {errors.date && <p className="form-error">{errors.date.message}</p>}
                </div>
                <div>
                  <label className="form-label">البيان</label>
                  <textarea
                    {...register('description')}
                    className="input"
                    rows={3}
                    placeholder="وصف الفاتورة"
                  />
                </div>
                <div>
                  <label className="form-label">التصنيف</label>
                  <input
                    {...register('category')}
                    className="input"
                    placeholder="تصنيف الفاتورة"
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary sm:ml-3"
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary mt-3 sm:mt-0"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Invoice Modal Component
function EditInvoiceModal({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  isLoading,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CreateInvoiceRequest>) => void;
  invoice: any;
  isLoading: boolean;
  type: 'in' | 'out';
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateInvoiceRequest>({
    defaultValues: {
      amount: Number(invoice.amount),
      currency: invoice.currency,
      description: invoice.description,
      date: invoice.date.split('T')[0],
      category: invoice.category,
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                تحديث فاتورة {type === 'in' ? 'وارد' : 'صادر'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">المبلغ</label>
                  <input
                    {...register('amount', { 
                      required: 'المبلغ مطلوب',
                      valueAsNumber: true
                    })}
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="المبلغ"
                  />
                  {errors.amount && <p className="form-error">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="form-label">العملة</label>
                  <select
                    {...register('currency', { required: 'العملة مطلوبة' })}
                    className="input"
                  >
                    <option value="">اختر العملة</option>
                    <option value="SYP">ليرة سورية</option>
                    <option value="TRY">ليرة تركية</option>
                    <option value="USD">دولار أمريكي</option>
                  </select>
                  {errors.currency && <p className="form-error">{errors.currency.message}</p>}
                </div>
                <div>
                  <label className="form-label">التاريخ</label>
                  <input
                    {...register('date', { required: 'التاريخ مطلوب' })}
                    type="date"
                    className="input"
                  />
                  {errors.date && <p className="form-error">{errors.date.message}</p>}
                </div>
                <div>
                  <label className="form-label">البيان</label>
                  <textarea
                    {...register('description')}
                    className="input"
                    rows={3}
                    placeholder="وصف الفاتورة"
                  />
                </div>
                <div>
                  <label className="form-label">التصنيف</label>
                  <input
                    {...register('category')}
                    className="input"
                    placeholder="تصنيف الفاتورة"
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary sm:ml-3"
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary mt-3 sm:mt-0"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// View Invoice Modal Component
function ViewInvoiceModal({
  isOpen,
  onClose,
  invoice,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  type: 'in' | 'out';
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              تفاصيل فاتورة {type === 'in' ? 'وارد' : 'صادر'}
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">المبلغ:</span>
                <span className="ml-2 text-gray-900">{Number(invoice.amount).toLocaleString()} {invoice.currency}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">التاريخ:</span>
                <span className="ml-2 text-gray-900">{new Date(invoice.date).toLocaleDateString('ar-SA')}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">البيان:</span>
                <span className="ml-2 text-gray-900">{invoice.description || '-'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">المورد/العميل:</span>
                <span className="ml-2 text-gray-900">{invoice.vendor?.name || invoice.customer?.name || '-'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">التصنيف:</span>
                <span className="ml-2 text-gray-900">{invoice.category || '-'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">تاريخ الإنشاء:</span>
                <span className="ml-2 text-gray-900">{new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">أنشأ بواسطة:</span>
                <span className="ml-2 text-gray-900">{invoice.creator?.fullName || '-'}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
