import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider, ErrorBoundary } from "./components/ui";
import { registerServiceWorker } from "./utils/serviceWorker";
import "./index.css";
import App from "./App.tsx";

// Register service worker for offline support (production only)
if (import.meta.env.PROD) {
  registerServiceWorker();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
