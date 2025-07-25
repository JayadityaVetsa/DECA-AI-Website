import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Apply theme from localStorage before React renders
(function applyThemeFromStorage() {
  const stored = localStorage.getItem("decaai-darkmode");
  if (stored === "true") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
