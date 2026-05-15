// ============================================================
// Toast notifications — wrapper around react-hot-toast
// ============================================================
import type { ToastType } from "@/stores/ui-store";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error: <XCircle className="w-5 h-5 text-error" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  info: <Info className="w-5 h-5 text-bright" />,
};

const toastClassName: Record<ToastType, string> = {
  success: "border-success/20 bg-success-light",
  error: "border-error/20 bg-error-light",
  warning: "border-warning/20 bg-warning-light",
  info: "border-bright/20 bg-lightblue",
};

export const showToast = {
  success: (title: string, message?: string) =>
    toast.custom(
      (t) => (
        <div
          className={`flex items-start gap-3 w-80 bg-white border rounded-lg shadow-elevated p-4 transition-all ${toastClassName.success} ${
            t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {icons.success}
          <div className="flex-1 min-w-0">
            <p className="text-body font-semibold text-navy">{title}</p>
            {message && <p className="text-body-sm text-dark-gray mt-0.5">{message}</p>}
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-medium-gray hover:text-navy">
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
      { duration: 4000 }
    ),

  error: (title: string, message?: string) =>
    toast.custom(
      (t) => (
        <div
          className={`flex items-start gap-3 w-80 bg-white border rounded-lg shadow-elevated p-4 transition-all ${toastClassName.error} ${
            t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {icons.error}
          <div className="flex-1 min-w-0">
            <p className="text-body font-semibold text-navy">{title}</p>
            {message && <p className="text-body-sm text-dark-gray mt-0.5">{message}</p>}
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-medium-gray hover:text-navy">
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
      { duration: 6000 }
    ),

  warning: (title: string, message?: string) =>
    toast.custom(
      (t) => (
        <div
          className={`flex items-start gap-3 w-80 bg-white border rounded-lg shadow-elevated p-4 transition-all ${toastClassName.warning} ${
            t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {icons.warning}
          <div className="flex-1 min-w-0">
            <p className="text-body font-semibold text-navy">{title}</p>
            {message && <p className="text-body-sm text-dark-gray mt-0.5">{message}</p>}
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-medium-gray hover:text-navy">
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
      { duration: 5000 }
    ),

  info: (title: string, message?: string) =>
    toast.custom(
      (t) => (
        <div
          className={`flex items-start gap-3 w-80 bg-white border rounded-lg shadow-elevated p-4 transition-all ${toastClassName.info} ${
            t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {icons.info}
          <div className="flex-1 min-w-0">
            <p className="text-body font-semibold text-navy">{title}</p>
            {message && <p className="text-body-sm text-dark-gray mt-0.5">{message}</p>}
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-medium-gray hover:text-navy">
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
      { duration: 4000 }
    ),
};

export { toast };
