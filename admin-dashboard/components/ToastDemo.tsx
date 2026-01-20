'use client';

/**
 * Toast Notification Demo Component
 *
 * This component demonstrates all toast notification types.
 * Use this to test the toast system or as a reference for implementation.
 *
 * To use: Import this component in any page and add <ToastDemo />
 */

import { useState } from 'react';
import { showSuccess, showError, showLoading, showInfo, dismissToast, showPromise } from '@/lib/toast';

export function ToastDemo() {
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null);

  const handleSuccess = () => {
    showSuccess('Driver approved successfully!');
  };

  const handleSuccessArabic = () => {
    showSuccess('تم الموافقة على السائق بنجاح!');
  };

  const handleError = () => {
    showError('Failed to update driver status');
  };

  const handleErrorArabic = () => {
    showError('فشل تحديث حالة السائق');
  };

  const handleInfo = () => {
    showInfo('New trip request received');
  };

  const handleLoading = () => {
    const id = showLoading('Processing request...');
    setLoadingToastId(id);

    // Auto-dismiss after 3 seconds for demo
    setTimeout(() => {
      dismissToast(id);
      showSuccess('Request completed!');
      setLoadingToastId(null);
    }, 3000);
  };

  const handleDismiss = () => {
    if (loadingToastId) {
      dismissToast(loadingToastId);
      setLoadingToastId(null);
    } else {
      dismissToast(); // Dismiss all
    }
  };

  const handlePromiseSuccess = async () => {
    const mockApiCall = new Promise((resolve) => {
      setTimeout(() => resolve({ data: 'Success!' }), 2000);
    });

    await showPromise(mockApiCall, {
      loading: 'Saving changes...',
      success: 'Changes saved successfully!',
      error: 'Failed to save changes',
    });
  };

  const handlePromiseError = async () => {
    const mockApiCall = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API Error')), 2000);
    });

    try {
      await showPromise(mockApiCall, {
        loading: 'Deleting item...',
        success: 'Item deleted successfully!',
        error: 'Failed to delete item',
      });
    } catch {
      // Error already handled by toast
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Toast Notifications Demo</h2>
      <p className="text-gray-600 mb-6">
        Click the buttons below to test different toast notification types.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Basic Toasts</h3>
          <div className="space-y-2">
            <button
              onClick={handleSuccess}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
            >
              Success Toast
            </button>

            <button
              onClick={handleSuccessArabic}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
            >
              Success (Arabic)
            </button>

            <button
              onClick={handleError}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Error Toast
            </button>

            <button
              onClick={handleErrorArabic}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Error (Arabic)
            </button>

            <button
              onClick={handleInfo}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Info Toast
            </button>

            <button
              onClick={handleLoading}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            >
              Loading Toast (auto-dismiss)
            </button>

            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Dismiss All
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-gray-700">Promise-Based Toasts</h3>
          <div className="space-y-2">
            <button
              onClick={handlePromiseSuccess}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
            >
              Promise Success (2s)
            </button>

            <button
              onClick={handlePromiseError}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Promise Error (2s)
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Usage Example:</h4>
            <pre className="text-xs bg-gray-800 text-white p-2 rounded overflow-x-auto">
{`import { showSuccess } from '@/lib/toast';

showSuccess('Driver approved!');`}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded">
        <h4 className="font-semibold text-emerald-800 mb-2">Features:</h4>
        <ul className="text-sm text-emerald-700 space-y-1">
          <li>✓ RTL support for Arabic text</li>
          <li>✓ Emerald theme matching dashboard</li>
          <li>✓ Auto-dismiss (4s success, 5s error)</li>
          <li>✓ Manual dismiss support</li>
          <li>✓ Promise-based loading states</li>
          <li>✓ Position: top-center</li>
        </ul>
      </div>
    </div>
  );
}
