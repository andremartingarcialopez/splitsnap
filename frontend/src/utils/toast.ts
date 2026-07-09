import { toast, type ToastOptions } from 'react-toastify';

const TOAST_DURATION_MS = 3000;

const baseOptions: ToastOptions = {
  autoClose: TOAST_DURATION_MS,
};

export function showSuccessToast(message: string) {
  toast.success(message, baseOptions);
}

export function showInfoToast(message: string) {
  toast.info(message, baseOptions);
}
