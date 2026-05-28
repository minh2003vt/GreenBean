import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import styles from "./Toast.module.css";

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

type ToastState = {
  id: number;
  message: string;
  type: "success" | "error";
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((message: string, type: ToastState["type"]) => {
    const id = Date.now();
    setToast({ id, message, type });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2600);
  }, []);

  const value = useMemo(
    () => ({
      showSuccess: (message: string) => show(message, "success"),
      showError: (message: string) => show(message, "error"),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className={toast.type === "success" ? styles.success : styles.error} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}
