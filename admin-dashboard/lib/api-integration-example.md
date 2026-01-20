# API Integration with Toast Notifications

This guide shows how to integrate toast notifications with the existing API client.

## Option 1: Add Global Error Handler to API Interceptor

You can add toast notifications directly in the axios interceptor for common errors:

```typescript
// In lib/api.ts - Add to response interceptor
import { showError } from './toast';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        showError('Session expired. Please login again.');
        localStorage.removeItem('wasalni-admin-auth');
        window.location.href = '/auth/login';
      }
    }

    // Handle 403 (Forbidden)
    if (error.response?.status === 403) {
      showError('You do not have permission to perform this action.');
    }

    // Handle 404 (Not Found)
    if (error.response?.status === 404) {
      showError('Resource not found.');
    }

    // Handle 500 (Server Error)
    if (error.response?.status === 500) {
      showError('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);
```

## Option 2: Component-Level Toast Integration

Use toasts in individual components for specific feedback:

### Example 1: Driver Approval with Loading State

```typescript
'use client';

import { useState } from 'react';
import { driversApi } from '@/lib/api';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';

export function DriverApprovalButton({ driverId }: { driverId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    const toastId = showLoading('Approving driver...');

    try {
      const response = await driversApi.approve(driverId);
      dismissToast(toastId);
      showSuccess(response.data.message || 'Driver approved successfully!');
      // Refresh data or redirect
    } catch (error: any) {
      dismissToast(toastId);
      const errorMsg = error.response?.data?.message || 'Failed to approve driver';
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleApprove} disabled={isLoading}>
      {isLoading ? 'Approving...' : 'Approve Driver'}
    </button>
  );
}
```

### Example 2: Using Promise Toast for Cleaner Code

```typescript
'use client';

import { driversApi } from '@/lib/api';
import { showPromise } from '@/lib/toast';

export function DriverApprovalButton({ driverId }: { driverId: string }) {
  const handleApprove = async () => {
    await showPromise(
      driversApi.approve(driverId),
      {
        loading: 'Approving driver...',
        success: 'Driver approved successfully!',
        error: 'Failed to approve driver',
      }
    );
    // Refresh data
  };

  return (
    <button onClick={handleApprove}>
      Approve Driver
    </button>
  );
}
```

### Example 3: Form Submission with Bilingual Support

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { promosApi } from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';

const schema = z.object({
  code: z.string().min(3),
  discount: z.number().min(1).max(100),
  maxUses: z.number().min(1),
});

type FormData = z.infer<typeof schema>;

export function PromoCodeForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await promosApi.create(data);

      // Show success with bilingual support
      const successMessage = response.data.message || 'Promo code created!';
      const successMessageAr = response.data.messageAr || 'تم إنشاء كود الخصم!';

      // Detect user language preference (you can store this in Zustand)
      const userLang = 'ar'; // or 'en'
      showSuccess(userLang === 'ar' ? successMessageAr : successMessage);

    } catch (error: any) {
      // Show error with bilingual support
      const errorMessage = error.response?.data?.message || 'Failed to create promo code';
      const errorMessageAr = error.response?.data?.messageAr || 'فشل إنشاء كود الخصم';

      const userLang = 'ar';
      showError(userLang === 'ar' ? errorMessageAr : errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('code')} placeholder="Promo Code" />
      {errors.code && <span>{errors.code.message}</span>}

      <input {...register('discount', { valueAsNumber: true })} placeholder="Discount %" />
      {errors.discount && <span>{errors.discount.message}</span>}

      <input {...register('maxUses', { valueAsNumber: true })} placeholder="Max Uses" />
      {errors.maxUses && <span>{errors.maxUses.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Promo Code'}
      </button>
    </form>
  );
}
```

### Example 4: Multiple Actions with Sequential Toasts

```typescript
'use client';

import { driversApi, passengersApi } from '@/lib/api';
import { showSuccess, showError, showInfo } from '@/lib/toast';

export function BulkActionsPanel({ selectedIds }: { selectedIds: string[] }) {
  const handleBulkApprove = async () => {
    showInfo(`Approving ${selectedIds.length} drivers...`);

    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      try {
        await driversApi.approve(id);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      showSuccess(`Successfully approved ${successCount} drivers`);
    }

    if (errorCount > 0) {
      showError(`Failed to approve ${errorCount} drivers`);
    }
  };

  return (
    <button onClick={handleBulkApprove}>
      Approve Selected ({selectedIds.length})
    </button>
  );
}
```

### Example 5: Real-time Updates with Socket.io

```typescript
'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { showInfo, showSuccess } from '@/lib/toast';

export function RealtimeNotifications() {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    socket.on('connect', () => {
      showInfo('Connected to live updates');
    });

    socket.on('trip:created', (data) => {
      showInfo(`New trip request from ${data.passenger.name}`);
    });

    socket.on('driver:approved', (data) => {
      showSuccess(`Driver ${data.driver.name} has been approved`);
    });

    socket.on('disconnect', () => {
      // Don't show toast on disconnect to avoid spam
      console.log('Disconnected from live updates');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null; // This is just a notification handler
}
```

## Option 3: Custom API Wrapper Hook

Create a custom hook that wraps API calls with toast notifications:

```typescript
// lib/hooks/useApiAction.ts
import { useState } from 'react';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';

interface UseApiActionOptions {
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApiAction<T = any>(
  apiCall: (...args: any[]) => Promise<T>,
  options: UseApiActionOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (...args: any[]) => {
    setIsLoading(true);
    setError(null);

    let toastId: string | undefined;
    if (options.loadingMessage) {
      toastId = showLoading(options.loadingMessage);
    }

    try {
      const response = await apiCall(...args);
      setData(response);

      if (toastId) dismissToast(toastId);

      const successMsg = options.successMessage || response.data?.message || 'Success';
      showSuccess(successMsg);

      if (options.onSuccess) {
        options.onSuccess(response);
      }

      return response;
    } catch (err: any) {
      setError(err);

      if (toastId) dismissToast(toastId);

      const errorMsg = options.errorMessage || err.response?.data?.message || 'An error occurred';
      showError(errorMsg);

      if (options.onError) {
        options.onError(err);
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, data, error };
}
```

Usage:

```typescript
'use client';

import { driversApi } from '@/lib/api';
import { useApiAction } from '@/lib/hooks/useApiAction';

export function DriverCard({ driver }: { driver: any }) {
  const { execute: approveDriver, isLoading } = useApiAction(
    driversApi.approve,
    {
      loadingMessage: 'Approving driver...',
      successMessage: 'Driver approved successfully!',
      errorMessage: 'Failed to approve driver',
      onSuccess: () => {
        // Refresh driver list or redirect
      },
    }
  );

  return (
    <div>
      <h3>{driver.name}</h3>
      <button onClick={() => approveDriver(driver._id)} disabled={isLoading}>
        {isLoading ? 'Approving...' : 'Approve'}
      </button>
    </div>
  );
}
```

## Best Practices

1. **Don't over-toast**: Only show toasts for important user actions
2. **Be specific**: Use clear, actionable messages
3. **Handle errors gracefully**: Always show error toasts for failed API calls
4. **Use loading states**: Show loading toasts for operations that take > 500ms
5. **Bilingual support**: Use the API's `message` and `messageAr` fields
6. **Dismiss loading toasts**: Always dismiss loading toasts after completion
7. **Auto-dismiss**: Success and info toasts auto-dismiss, errors stay longer
8. **Network errors**: Handle network errors separately from API errors
