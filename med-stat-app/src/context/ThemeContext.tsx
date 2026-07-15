import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { getProfile, updateProfile } from "../api/authApi";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: any) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "light",
  );

  useEffect(() => {
    if (!user) return;

    getProfile()
      .then((data) => {
        const remoteTheme = data?.user?.theme as Theme | undefined;
        if (remoteTheme === "light" || remoteTheme === "dark") {
          setThemeState(remoteTheme);
          localStorage.setItem("theme", remoteTheme);
        }
      })
      .catch(() => {
        // keep whatever theme was already applied (localStorage/default)
      });
  }, [user]);

  // Note: applying `data-theme` to the DOM is owned by <ThemeRouteSync>
  // (rendered inside the router), not here — it needs the current route to
  // force light on the pre-auth login/register pages, and doing it there
  // avoids a mount-order race between this provider and any page-level
  // override effect.

  const applyTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem("theme", next);

    if (user) {
      updateProfile({ theme: next }).catch(() => {
        // best-effort persistence; local state already reflects the change
      });
    }
  };

  const toggleTheme = () => {
    applyTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
