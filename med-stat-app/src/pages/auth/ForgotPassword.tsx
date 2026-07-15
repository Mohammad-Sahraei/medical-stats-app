import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { forgotPassword, resetPassword } from "../../api/authApi";
import { useToast } from "../../context/ToastContext";

import "./Register.scss";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRequestCode = async () => {
    if (!username.trim()) {
      setErrors({ username: "نام کاربری را وارد کنید" });
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const res = await forgotPassword(username.trim());
      showToast(res.message || "کد تایید ارسال شد", "success");
      setStep("reset");
    } catch (err: any) {
      showToast(err?.response?.data?.error || "خطا در ارسال کد تایید", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) newErrors.code = "کد تایید را وارد کنید";
    if (!newPassword.trim()) newErrors.newPassword = "رمز عبور جدید را وارد کنید";
    else if (newPassword.length < 6)
      newErrors.newPassword = "رمز عبور باید حداقل ۶ کاراکتر باشد";

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "تکرار رمز عبور را وارد کنید";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "رمز عبور یکسان نیست";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);

    try {
      await resetPassword({
        username: username.trim(),
        code: code.trim(),
        new_password: newPassword,
      });
      showToast("رمز عبور با موفقیت تغییر کرد", "success");
      navigate("/login");
    } catch (err: any) {
      showToast(err?.response?.data?.error || "خطا در تغییر رمز عبور", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-content">
        {step === "request" ? (
          <>
            <p className="forgot-password-hint">
              نام کاربری خود را وارد کنید تا کد تایید به ایمیل ثبت‌شده شما
              ارسال شود.
            </p>

            <div className="input-group">
              <input
                type="text"
                placeholder="نام کاربری"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {errors.username && <p className="error-text">{errors.username}</p>}
            </div>

            <button
              className="register-button"
              onClick={handleRequestCode}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="spin" size={18} /> : "ارسال کد تایید"}
            </button>
          </>
        ) : (
          <>
            <p className="forgot-password-hint">
              کد تایید ارسال‌شده به ایمیل خود و رمز عبور جدید را وارد کنید.
            </p>

            <div className="input-group">
              <input
                type="text"
                placeholder="کد تایید"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              {errors.code && <p className="error-text">{errors.code}</p>}
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="رمز عبور جدید"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errors.newPassword && <p className="error-text">{errors.newPassword}</p>}
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="تکرار رمز عبور جدید"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              className="register-button"
              onClick={handleResetPassword}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="spin" size={18} /> : "تغییر رمز عبور"}
            </button>

            <p className="login-link">
              کد را دریافت نکردید؟{" "}
              <a style={{ cursor: "pointer" }} onClick={() => setStep("request")}>
                ارسال مجدد
              </a>
            </p>
          </>
        )}

        <p className="login-link">
          <a style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>
            بازگشت به ورود
          </a>
        </p>
      </div>
    </div>
  );
}
