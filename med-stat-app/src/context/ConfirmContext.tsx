import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import "./Confirm.scss";

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  message: string;
}

interface ConfirmContextType {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const ConfirmProvider = ({ children }: any) => {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ message, ...options });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setState(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {state && (
        <div className="confirm-overlay" onClick={() => handleClose(false)}>
          <div
            className={`confirm-modal ${state.danger ? "confirm-danger" : ""}`}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="confirm-icon">
              <AlertTriangle size={26} />
            </div>

            {state.title && <h3>{state.title}</h3>}

            <p>{state.message}</p>

            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-btn-cancel"
                onClick={() => handleClose(false)}
              >
                {state.cancelText || "انصراف"}
              </button>

              <button
                type="button"
                className={state.danger ? "confirm-btn-danger" : "confirm-btn-primary"}
                onClick={() => handleClose(true)}
              >
                {state.confirmText || "تأیید"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx.confirm;
};
