import toast from 'react-hot-toast';

/**
 * Show a success toast notification
 * @param message - The message to display
 */
export const showSuccess = (message: string) => {
  return toast.success(message, {
    duration: 4000,
    position: 'top-center',
  });
};

/**
 * Show an error toast notification
 * @param message - The error message to display
 */
export const showError = (message: string) => {
  return toast.error(message, {
    duration: 5000,
    position: 'top-center',
  });
};

/**
 * Show a loading toast notification
 * @param message - The loading message to display
 * @returns Toast ID that can be used to dismiss the toast
 */
export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-center',
  });
};

/**
 * Show an info toast notification
 * @param message - The info message to display
 */
export const showInfo = (message: string) => {
  return toast(message, {
    duration: 4000,
    position: 'top-center',
    icon: 'ℹ️',
  });
};

/**
 * Dismiss a specific toast or all toasts
 * @param toastId - Optional toast ID to dismiss a specific toast
 */
export const dismissToast = (toastId?: string) => {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
};

/**
 * Show a promise-based toast with loading/success/error states
 * @param promise - The promise to track
 * @param messages - Messages for loading, success, and error states
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      position: 'top-center',
    }
  );
};
