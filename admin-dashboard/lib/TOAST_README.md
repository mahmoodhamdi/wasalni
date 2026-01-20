# React Hot Toast Implementation

This document describes the toast notification system added to the Wasalni admin dashboard.

## Installation

```bash
npm install react-hot-toast --legacy-peer-deps
```

## Files Added/Modified

1. **`/media/alash/New Volume/wasalni/admin-dashboard/lib/toast.ts`**
   - Core toast utility functions
   - Exports: `showSuccess`, `showError`, `showLoading`, `showInfo`, `dismissToast`, `showPromise`

2. **`/media/alash/New Volume/wasalni/admin-dashboard/app/layout.tsx`**
   - Added `<Toaster />` component to root layout
   - Configured with emerald theme colors matching dashboard
   - Position: top-center
   - RTL support for Arabic text

3. **`/media/alash/New Volume/wasalni/admin-dashboard/lib/toast.example.md`**
   - Usage examples and patterns

4. **`/media/alash/New Volume/wasalni/admin-dashboard/lib/api-integration-example.md`**
   - API integration patterns
   - Bilingual support examples

## Quick Start

### Import Toast Functions

```typescript
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';
```

### Basic Usage

```typescript
// Success
showSuccess('Driver approved successfully!');

// Error
showError('Failed to update status');

// Loading
const toastId = showLoading('Processing...');
// Later...
dismissToast(toastId);
```

### With API Calls

```typescript
import { driversApi } from '@/lib/api';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';

async function approveDriver(driverId: string) {
  const toastId = showLoading('Approving driver...');

  try {
    await driversApi.approve(driverId);
    dismissToast(toastId);
    showSuccess('Driver approved successfully!');
  } catch (error) {
    dismissToast(toastId);
    showError('Failed to approve driver');
  }
}
```

### Promise-Based (Recommended for API Calls)

```typescript
import { showPromise } from '@/lib/toast';
import { driversApi } from '@/lib/api';

await showPromise(
  driversApi.approve(driverId),
  {
    loading: 'Approving driver...',
    success: 'Driver approved successfully!',
    error: 'Failed to approve driver',
  }
);
```

## Theme Configuration

The toasts are styled to match the dashboard theme:

### Success Toast
- Background: `#ecfdf5` (emerald-50)
- Text: `#065f46` (emerald-800)
- Border: `#10b981` (emerald-500)
- Icon: Green checkmark

### Error Toast
- Background: `#fef2f2` (red-50)
- Text: `#991b1b` (red-800)
- Border: `#ef4444` (red-500)
- Icon: Red X

### Loading Toast
- Background: `#f0fdf4` (green-50)
- Text: `#166534` (green-800)
- Border: `#10b981` (emerald-500)
- Icon: Spinning emerald circle

### Info Toast
- Background: `#fff` (white)
- Text: `#363636` (dark gray)
- Icon: Info symbol

## Bilingual Support

The toast system supports both English and Arabic:

```typescript
// Detect user language (store in Zustand or context)
const userLang = 'ar'; // or 'en'

// API responses include both message and messageAr
const response = await api.post('/admin/drivers', data);

const message = userLang === 'ar'
  ? response.data.messageAr
  : response.data.message;

showSuccess(message);
```

The Toaster component automatically handles RTL layout for Arabic text.

## API Integration

### Option 1: Component-Level

Use toast functions in individual components for specific user actions.

### Option 2: Global Interceptor

Add toast notifications to axios interceptors for common errors:

```typescript
// In lib/api.ts
import { showError } from './toast';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      showError('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);
```

### Option 3: Custom Hook

Create a `useApiAction` hook that wraps API calls with toasts (see examples).

## Available Functions

### `showSuccess(message: string): string`
Display a success toast. Returns toast ID.

### `showError(message: string): string`
Display an error toast. Returns toast ID.

### `showLoading(message: string): string`
Display a loading toast. Returns toast ID (use to dismiss later).

### `showInfo(message: string): string`
Display an info toast. Returns toast ID.

### `dismissToast(toastId?: string): void`
Dismiss a specific toast or all toasts.

### `showPromise<T>(promise: Promise<T>, messages: { loading, success, error }): Promise<T>`
Display loading/success/error toasts based on promise state.

## Best Practices

1. **Use promise toast for async operations** - Cleaner code
2. **Always dismiss loading toasts** - Prevent UI clutter
3. **Be specific with messages** - Help users understand what happened
4. **Handle errors gracefully** - Always show error feedback
5. **Don't over-toast** - Only for important actions
6. **Support both languages** - Use API's `message` and `messageAr`
7. **Position matters** - Top-center is best for admin dashboards

## Testing

The toast system works in development and production builds:

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## Troubleshooting

### Toast not appearing
- Ensure `<Toaster />` is in the root layout
- Check browser console for errors
- Verify toast function is imported correctly

### Styling issues
- Toast styles are inline (not affected by Tailwind purge)
- Check browser DevTools for z-index conflicts
- Verify the layout.tsx changes were applied

### RTL not working
- The Toaster automatically handles RTL for Arabic text
- No additional configuration needed

## Examples

See:
- `/media/alash/New Volume/wasalni/admin-dashboard/lib/toast.example.md` - Basic usage
- `/media/alash/New Volume/wasalni/admin-dashboard/lib/api-integration-example.md` - API integration

## Next Steps

1. Add toast notifications to existing forms and actions
2. Consider adding global error handler in API interceptor
3. Create a custom `useApiAction` hook for common patterns
4. Add language detection to Zustand store for bilingual support
