import ReactDOM from "react-dom/client";
import router from "./routes/AppRouter";
import "./index.css";
import "./styles/main.scss";

import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import InstallPrompt from "./components/installprompt/InstallPrompt";
import UpdatePrompt from "./components/updateprompt/UpdatePrompt";

ReactDOM.createRoot(document.getElementById("root")!).render(

  <AuthProvider>

    <ThemeProvider>

      <ToastProvider>

        <ConfirmProvider>

          <RouterProvider router={router} />
          <InstallPrompt />
          <UpdatePrompt />

        </ConfirmProvider>

      </ToastProvider>

    </ThemeProvider>

  </AuthProvider>
);

