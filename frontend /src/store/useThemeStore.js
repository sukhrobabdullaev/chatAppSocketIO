import { create } from "zustand";

// Get initial theme and apply it immediately
const initialTheme = localStorage.getItem("chat-theme") || "winter";
document.documentElement.setAttribute("data-theme", initialTheme);

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);

    // Apply theme to HTML element for proper DaisyUI theming
    document.documentElement.setAttribute("data-theme", theme);

    set({ theme });
  },
}));
