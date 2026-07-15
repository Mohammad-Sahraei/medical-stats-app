import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import "./login.scss";

export default function Login() {

  const navigate = useNavigate();
  const { login, user, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    api: "",
  });

const handleLogin = async () => {

  const newErrors = {
    username: username ? "" : "نام کاربری نمی‌تواند خالی باشد",
    password: password ? "" : "رمز عبور نمی‌تواند خالی باشد",
    api: "",
  };

  setErrors(newErrors);

  if (newErrors.username || newErrors.password) {
    return;
  }

  try {

    const user = await login(username, password);

    if (user.role === "student") {
      navigate("/student");
    } 
    else if (user.role === "professor") {
      navigate("/professor");
    } 
    else if (user.role === "admin") {
      navigate("/admin");
    } 
    else {
      navigate("/");
    }

  } catch (error: any) {

    setErrors((prev) => ({
      ...prev,
      api: "نام کاربری یا رمز عبور اشتباه است",
    }));
  }
};

  // A valid session already exists (e.g. the PWA reopened straight to
  // /login) — skip the form and go straight to the user's dashboard
  // instead of forcing them to log in again.
  if (loading) {
    return null;
  }

  if (user) {
    if (user.role === "student") return <Navigate to="/student" replace />;
    if (user.role === "professor") return <Navigate to="/professor" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">

      <div className="login-content">

        <img
          src="/icons/FirstIcon.png"
          className="login-logo"
        />

        <div className="input-group">
          <input
            placeholder="نام کاربری"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {errors.username && (
            <p className="error-text">
              {errors.username}
            </p>
          )}
        </div>

        <div className="input-group">
          <input
            placeholder="رمز عبور"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errors.password && (
            <p className="error-text">
              {errors.password}
            </p>
          )}
        </div>

        <p className="forgot-password-link">
          <a
            onClick={() => navigate("/forgot-password")}
            style={{ cursor: "pointer" }}
          >
            رمز عبور را فراموش کرده‌اید؟
          </a>
        </p>

        {errors.api && (
          <p className="error-text">
            {errors.api}
          </p>
        )}

        <button
          className="login-button"
          onClick={handleLogin}
        >
          ورود
        </button>

        <p className="register-link">
          قبلاً ثبت‌نام نکرده‌اید؟{" "}

          <a
            onClick={() => navigate("/register")}
            style={{ cursor: "pointer" }}
          >
            ثبت‌نام
          </a>

        </p>

      </div>

    </div>
  );
}
