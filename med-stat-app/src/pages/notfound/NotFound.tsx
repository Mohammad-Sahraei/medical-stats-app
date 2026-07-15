import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import "./notfound.scss";

export default function NotFound() {

  const navigate = useNavigate();
  const { user } = useAuth();

  const goHome = () => {
    if (user?.role === "student") {
      navigate("/student", { replace: true });
    } else if (user?.role === "professor") {
      navigate("/professor", { replace: true });
    } else if (user?.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <h1>۴۰۴</h1>
        <p>صفحه مورد نظر پیدا نشد</p>

        <button className="notfound-button" onClick={goHome}>
          بازگشت به خانه
        </button>
      </div>
    </div>
  );
}
