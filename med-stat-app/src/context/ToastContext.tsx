import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

import "./Toast.scss";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export const ToastProvider = ({ children }: any) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="toast-container">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];

          return (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <Icon size={18} />
              <span>{toast.message}</span>

              <button
                type="button"
                className="toast-close"
                onClick={() => dismissToast(toast.id)}
                aria-label="بستن"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};
