import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import './i18n/config';

// Set initial language and direction
const savedLang = localStorage.getItem('i18nextLng') || 'en';
document.documentElement.lang = savedLang;
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

// Attach session header for API requests (development fallback)
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const url =
      typeof input === "string"
        ? new URL(input, window.location.origin)
        : new URL(input.url, window.location.origin);

    const isApiRequest = url.pathname.startsWith("/api/");
    if (!isApiRequest || !sessionId) {
      return originalFetch(input, init);
    }

    const baseRequest = input instanceof Request ? input : new Request(url.toString(), init);
    const headers = new Headers(baseRequest.headers);
    headers.set("x-session-id", sessionId);

    const requestWithSession = new Request(baseRequest, { headers });
    return originalFetch(requestWithSession);
  } catch {
    return originalFetch(input, init);
  }
};

createRoot(document.getElementById("root")!).render(<App />);
