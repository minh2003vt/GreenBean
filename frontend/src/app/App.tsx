import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/app/AuthContext";
import { AppRoutes } from "@/app/routes";
import { ToastProvider } from "@/components/ui/Toast";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
