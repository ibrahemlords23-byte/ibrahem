import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useLanguage } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { User, CreateUserRequest, UpdateUserRequest, UserRole } from '../types';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

export default function Users() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: usersData, isLoading } = useQuery(
    ['users', searchTerm],
    () => apiService.getUsers(1, 50, searchTerm),
    {
      keepPreviousData: true,
    }
  );

  const createUserMutation = useMutation(
    (userData: CreateUserRequest) => apiService.createUser(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setIsCreateModalOpen(false);
        toast.success('تم إنشاء المستخدم بنجاح');
      },
      onError: (error: any) => {
        toast.error(error.message || 'فشل في إنشاء المستخدم');
      },
    }
  );

  const updateUserMutation = useMutation(
    ({ id, userData }: { id: string; userData: UpdateUserRequest }) =>
      apiService.updateUser(id, userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setIsEditModalOpen(false);
        toast.success('تم تحديث المستخدم بنجاح');
      },
      onError: (error: any) => {
        toast.error(error.message || 'فشل في تحديث المستخدم');
      },
    }
  );

  const deleteUserMutation = useMutation(
    (id: string) => apiService.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('تم حذف المستخدم بنجاح');
      },
      onError: (error: any) => {
        toast.error(error.message || 'فشل في حذف المستخدم');
      },
    }
  );

  const getRoleName = (role: UserRole) => {
    const roleMap = {
      SUPER_ADMIN: 'مدير النظام',
      ADMIN: 'مدير',
      ACCOUNTANT: 'محاسب',
      WAREHOUSE_MANAGER: 'مدير مستودع',
      USER: 'مستخدم',
    };
    return roleMap[role] || role;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="badge badge-success">نشط</span>
    ) : (
      <span className="badge badge-danger">غير نشط</span>
    );
  };

  const handleCreateUser = (data: CreateUserRequest) => {
    createUserMutation.mutate(data);
  };

  const handleUpdateUser = (data: UpdateUserRequest) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, userData: data });
    }
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      deleteUserMutation.mutate(id);
    }
  };

  const canManageUsers = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
        {canManageUsers && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('users.add')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="البحث في المستخدمين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Users table */}
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
                  <th>{t('users.name')}</th>
                  <th>اسم المستخدم</th>
                  <th>{t('users.email')}</th>
                  <th>{t('users.phone')}</th>
                  <th>{t('users.role')}</th>
                  <th>{t('users.status')}</th>
                  <th>{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.data.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.fullName}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || '-'}</td>
                    <td>{getRoleName(user.role)}</td>
                    <td>{getStatusBadge(user.isActive)}</td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsViewModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {canManageUsers && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
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

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateUser}
          isLoading={createUserMutation.isLoading}
        />
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateUser}
          user={selectedUser}
          isLoading={updateUserMutation.isLoading}
        />
      )}

      {/* View User Modal */}
      {isViewModalOpen && selectedUser && (
        <ViewUserModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          user={selectedUser}
        />
      )}
    </div>
  );
}

// Create User Modal Component
function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserRequest>();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">إضافة مستخدم جديد</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">اسم المستخدم</label>
                  <input
                    {...register('username', { required: 'اسم المستخدم مطلوب' })}
                    className="input"
                    placeholder="اسم المستخدم"
                  />
                  {errors.username && <p className="form-error">{errors.username.message}</p>}
                </div>
                <div>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    {...register('email', { 
                      required: 'البريد الإلكتروني مطلوب',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'البريد الإلكتروني غير صحيح'
                      }
                    })}
                    type="email"
                    className="input"
                    placeholder="البريد الإلكتروني"
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="form-label">كلمة المرور</label>
                  <input
                    {...register('password', { 
                      required: 'كلمة المرور مطلوبة',
                      minLength: {
                        value: 6,
                        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
                      }
                    })}
                    type="password"
                    className="input"
                    placeholder="كلمة المرور"
                  />
                  {errors.password && <p className="form-error">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="form-label">الاسم الكامل</label>
                  <input
                    {...register('fullName', { required: 'الاسم الكامل مطلوب' })}
                    className="input"
                    placeholder="الاسم الكامل"
                  />
                  {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="form-label">رقم الهاتف</label>
                  <input
                    {...register('phone')}
                    className="input"
                    placeholder="رقم الهاتف"
                  />
                </div>
                <div>
                  <label className="form-label">الدور</label>
                  <select
                    {...register('role', { required: 'الدور مطلوب' })}
                    className="input"
                  >
                    <option value="">اختر الدور</option>
                    <option value="ADMIN">مدير</option>
                    <option value="ACCOUNTANT">محاسب</option>
                    <option value="WAREHOUSE_MANAGER">مدير مستودع</option>
                    <option value="USER">مستخدم</option>
                  </select>
                  {errors.role && <p className="form-error">{errors.role.message}</p>}
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

// Edit User Modal Component
function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateUserRequest) => void;
  user: User;
  isLoading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateUserRequest>({
    defaultValues: {
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">تحديث المستخدم</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">اسم المستخدم</label>
                  <input
                    {...register('username', { required: 'اسم المستخدم مطلوب' })}
                    className="input"
                    placeholder="اسم المستخدم"
                  />
                  {errors.username && <p className="form-error">{errors.username.message}</p>}
                </div>
                <div>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    {...register('email', { 
                      required: 'البريد الإلكتروني مطلوب',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'البريد الإلكتروني غير صحيح'
                      }
                    })}
                    type="email"
                    className="input"
                    placeholder="البريد الإلكتروني"
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="form-label">الاسم الكامل</label>
                  <input
                    {...register('fullName', { required: 'الاسم الكامل مطلوب' })}
                    className="input"
                    placeholder="الاسم الكامل"
                  />
                  {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="form-label">رقم الهاتف</label>
                  <input
                    {...register('phone')}
                    className="input"
                    placeholder="رقم الهاتف"
                  />
                </div>
                <div>
                  <label className="form-label">الدور</label>
                  <select
                    {...register('role', { required: 'الدور مطلوب' })}
                    className="input"
                  >
                    <option value="">اختر الدور</option>
                    <option value="ADMIN">مدير</option>
                    <option value="ACCOUNTANT">محاسب</option>
                    <option value="WAREHOUSE_MANAGER">مدير مستودع</option>
                    <option value="USER">مستخدم</option>
                  </select>
                  {errors.role && <p className="form-error">{errors.role.message}</p>}
                </div>
                <div>
                  <label className="form-label">الحالة</label>
                  <select
                    {...register('isActive')}
                    className="input"
                  >
                    <option value="true">نشط</option>
                    <option value="false">غير نشط</option>
                  </select>
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

// View User Modal Component
function ViewUserModal({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">تفاصيل المستخدم</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">الاسم الكامل:</span>
                <span className="ml-2 text-gray-900">{user.fullName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">اسم المستخدم:</span>
                <span className="ml-2 text-gray-900">{user.username}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">البريد الإلكتروني:</span>
                <span className="ml-2 text-gray-900">{user.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">رقم الهاتف:</span>
                <span className="ml-2 text-gray-900">{user.phone || '-'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">الدور:</span>
                <span className="ml-2 text-gray-900">{user.role}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">الحالة:</span>
                <span className="ml-2">
                  {user.isActive ? (
                    <span className="badge badge-success">نشط</span>
                  ) : (
                    <span className="badge badge-danger">غير نشط</span>
                  )}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">تاريخ الإنشاء:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                </span>
              </div>
              {user.lastLogin && (
                <div>
                  <span className="font-medium text-gray-700">آخر تسجيل دخول:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(user.lastLogin).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              )}
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
