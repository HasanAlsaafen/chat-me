import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type Accent =
  | "blue"
  | "green"
  | "purple"
  | "pink"
  | "orange"
  | "red"
  | "teal";

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

function applyAccent(accent: Accent) {
  document.documentElement.dataset.accent = accent;
}

interface ThemeState {
  theme: Theme;
  accent: Accent;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      accent: "blue",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setAccent: (accent) => {
        applyAccent(accent);
        set({ accent });
      },
    }),
    {
      name: "chatme-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
          applyAccent(state.accent);
        }
      },
    },
  ),
);

applyTheme(useThemeStore.getState().theme);
applyAccent(useThemeStore.getState().accent);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (useThemeStore.getState().theme === "system") applyTheme("system");
});
