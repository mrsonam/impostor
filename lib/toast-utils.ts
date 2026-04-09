import { toast } from 'react-toastify';

/**
 * Custom error toast that ensures the error icon and message are on the same line
 */
export const showErrorToast = (message: string) => {
  return toast.error(message, {
    position: "bottom-right",
    autoClose: 3000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "impostor-toast",
    icon: false,
  });
};

/**
 * Custom success toast
 */
export const showSuccessToast = (message: string) => {
  return toast.success(message, {
    position: "bottom-right",
    autoClose: 2000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "impostor-toast",
    icon: false,
  });
};

/**
 * Custom info toast
 */
export const showInfoToast = (message: string) => {
  return toast.info(message, {
    position: "bottom-right",
    autoClose: 2000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "impostor-toast",
    icon: false,
  });
};
