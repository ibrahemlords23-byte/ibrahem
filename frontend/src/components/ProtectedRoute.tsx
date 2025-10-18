import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkTrialStatus } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check trial status
  if (!checkTrialStatus()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">انتهت فترة التجربة</h1>
          <p className="text-gray-600 mb-6">
            انتهت فترة التجربة المجانية. يرجى التواصل مع الإدارة لتفعيل النسخة الكاملة.
          </p>
          <button
            onClick={() => window.location.href = 'mailto:support@ibrahim-accounting.com'}
            className="btn btn-primary"
          >
            التواصل مع الدعم
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
