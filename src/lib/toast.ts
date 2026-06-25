import { ApiError } from "@/lib/apiErrors";
import { toast as rt, type ToastOptions } from "react-toastify";

const defaults: ToastOptions = {
  position: "top-right",
  autoClose: 4800,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

function merge(opts?: ToastOptions): ToastOptions {
  return { ...defaults, ...opts };
}

function apiErrorMessage(err: unknown): string {
  if (ApiError.isApiError(err)) {
    return err.message;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Erro inesperado. Tente novamente.";
}

export const toast = {
  success: (message: string, opts?: ToastOptions) => rt.success(message, merge(opts)),
  error: (message: string, opts?: ToastOptions) => rt.error(message, merge(opts)),
  info: (message: string, opts?: ToastOptions) => rt.info(message, merge(opts)),
  warning: (message: string, opts?: ToastOptions) => rt.warning(message, merge(opts)),
  dismiss: rt.dismiss,
  apiError: (err: unknown, opts?: ToastOptions) => rt.error(apiErrorMessage(err), merge(opts)),
};
