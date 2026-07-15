import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const LIGHT_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

/**
 * Single source of truth for the `data-theme` DOM attribute. Rendered as the
 * router's root layout so it can react to both theme changes and route
 * changes: the pre-auth login/register pages always render light (no theme
 * jump before the account's own preference is known), everywhere else
 * reflects the account/local theme.
 */
export default function ThemeRouteSync() {
  const { theme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const forceLight = LIGHT_ONLY_PATHS.includes(location.pathname);
    document.documentElement.setAttribute("data-theme", forceLight ? "light" : theme);
  }, [theme, location.pathname]);

  return <Outlet />;
}
