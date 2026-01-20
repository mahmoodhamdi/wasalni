# Toast Notifications Usage Guide

This guide shows how to use the toast notification system in the admin dashboard.

## Import the Toast Functions

```typescript
import { showSuccess, showError, showLoading, showInfo, dismissToast, showPromise } from '@/lib/toast';
```

## Basic Usage Examples

### Success Toast
```typescript
// Simple success message
showSuccess('Driver approved successfully!');
showSuccess('تم الموافقة على السائق بنجاح!'); // Arabic support
```

### Error Toast
```typescript
// Error message
showError('Failed to update driver status');
showError('فشل تحديث حالة السائق'); // Arabic support
```

### Loading Toast
```typescript
// Show loading toast and store the ID
const loadingToast = showLoading('Processing request...');

// Later, dismiss the loading toast
dismissToast(loadingToast);

// Or show success after loading
setTimeout(() => {
  dismissToast(loadingToast);
  showSuccess('Request completed!');
}, 2000);
```

### Info Toast
```typescript
showInfo('New trip request received');
```

## Advanced Usage

### Promise-Based Toast
Perfect for async operations:

```typescript
const updateDriver = async (driverId: string, status: string) => {
  return showPromise(
    api.put(`/admin/drivers/${driverId}`, { status }),
    {
      loading: 'Updating driver status...',
      success: 'Driver status updated successfully!',
      error: 'Failed to update driver status',
    }
  );
};
```

### With API Calls
```typescript
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';
import { api } from '@/lib/api';

async function approveDriver(driverId: string) {
  const toastId = showLoading('Approving driver...');

  try {
    await api.put(`/admin/drivers/${driverId}`, { status: 'approved' });
    dismissToast(toastId);
    showSuccess('Driver approved successfully!');
  } catch (error) {
    dismissToast(toastId);
    showError('Failed to approve driver');
  }
}
```

### Bilingual Support (English & Arabic)
The toast component supports RTL automatically for Arabic text:

```typescript
// Detect language and show appropriate message
const message = isArabic ? 'تم حفظ التغييرات' : 'Changes saved';
showSuccess(message);

// Or use both in API responses
const response = await api.post('/admin/trips', data);
// If API returns both message and messageAr
showSuccess(lang === 'ar' ? response.data.messageAr : response.data.message);
```

### Multiple Toasts
```typescript
// All toasts will stack vertically with 8px gutter
showInfo('Processing payment...');
showSuccess('Trip completed');
showError('Connection lost');
```

### Dismiss All Toasts
```typescript
// Dismiss all active toasts
dismissToast();
```

## Integration with Forms

### React Hook Form Example
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { showSuccess, showError } from '@/lib/toast';
import { api } from '@/lib/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type FormData = z.infer<typeof schema>;

export function DriverForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await api.post('/admin/drivers', data);
      showSuccess(response.data.message);
    } catch (error: any) {
      showError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      <input {...register('email')} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Integration with API Interceptors

You can also add toast notifications to axios interceptors:

```typescript
// In lib/api.ts
import { showError } from './toast';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      showError('Session expired. Please login again.');
    } else if (error.response?.status === 500) {
      showError('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);
```

## Styling

The toasts are pre-styled with emerald theme colors matching the dashboard:

- **Success**: Emerald green background (#ecfdf5) with emerald border
- **Error**: Red background (#fef2f2) with red border
- **Loading**: Green background (#f0fdf4) with emerald border
- **Info**: Default white background

All toasts have smooth animations and will appear at the top-center of the screen.
