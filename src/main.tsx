import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.info("[boot] main.tsx loaded", {
  href: window.location.href,
  userAgent: navigator.userAgent,
});

// Surface crashes that sometimes appear as a "white screen"
window.addEventListener("error", (event) => {
  console.error("[window.error]", event.error || event.message, event);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("[unhandledrejection]", event.reason, event);
});

const rootEl = document.getElementById("root");
if (!rootEl) {
  // If this happens, React will never mount.
  document.body.innerHTML = "<pre>Fatal: #root element not found</pre>";
  throw new Error("Fatal: #root element not found");
}

// Diagnostic: if React never mounts, we should see this log.
setTimeout(() => {
  if (rootEl.innerHTML.trim() === "") {
    console.error("[boot] root is still empty after 1500ms (possible JS runtime error before render)");
  }
}, 1500);

createRoot(rootEl).render(<App />);
