import { useContext } from "react";
import { useMatches, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import NotificationBell from "../notifications/NotificationBell";
import "./AppHeader.scss";

interface RouteHandle {
  title?: string;
  hideBack?: boolean;
}

export default function AppHeader() {
  const matches = useMatches();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const isStudent = auth?.user?.role === "student";

  const withHandle = [...matches]
    .reverse()
    .find((match) => (match.handle as RouteHandle | undefined)?.title);

  const handle = withHandle?.handle as RouteHandle | undefined;

  if (!handle?.title) return null;

  return (
    <header className="app-header">
      <div className="app-header-side">
        {!handle.hideBack && (
          <button
            type="button"
            className="app-header-back"
            onClick={() => navigate(-1)}
            aria-label="بازگشت"
          >
            <ArrowRight size={22} />
          </button>
        )}
      </div>

      <h1 className="app-header-title">{handle.title}</h1>

      <div className="app-header-side">
        {isStudent && <NotificationBell />}
      </div>
    </header>
  );
}
