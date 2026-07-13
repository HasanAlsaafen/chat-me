import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./store/themeStore";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline shell/installability is a progressive enhancement; ignore failures.
    });
  });
}
