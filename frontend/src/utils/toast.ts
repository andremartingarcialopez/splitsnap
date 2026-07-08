import { toast, type ToastOptions } from 'react-toastify';

const TOAST_DURATION_MS = 3000;

const successOptions: ToastOptions = {
  autoClose: TOAST_DURATION_MS,
};

export function showSuccessToast(message: string) {
  toast.success(message, successOptions);
}
