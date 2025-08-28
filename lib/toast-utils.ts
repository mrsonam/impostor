import { toast } from 'react-toastify';

/**
 * Custom error toast that ensures the error icon and message are on the same line
 */
export const showErrorToast = (message: string) => {
  return toast.error(message, {
    position: "bottom-center",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "error-toast-custom",
  });
};

/**
 * Custom success toast
 */
export const showSuccessToast = (message: string) => {
  return toast.success(message, {
    position: "bottom-center",
    autoClose: 2000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Custom info toast
 */
export const showInfoToast = (message: string) => {
  return toast.info(message, {
    position: "bottom-center",
    autoClose: 2000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};
