import { useState } from "react";
import "./Register.scss";
import { registerStudent } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

type RegisterForm = {
  firstName: string;
  lastName: string;
  studentId: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type RegisterErrors = Partial<RegisterForm>;

export default function Register() {

  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    studentId: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<RegisterErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    const newErrors: RegisterErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = "نام را وارد کنید";
    if (!form.lastName.trim()) newErrors.lastName = "نام خانوادگی را وارد کنید";
    if (!form.studentId.trim()) newErrors.studentId = "شماره دانشجویی را وارد کنید";
    if (!form.username.trim()) newErrors.username = "نام کاربری را وارد کنید";

    if (!form.email.trim()) {
      newErrors.email = "ایمیل را وارد کنید";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      newErrors.email = "ایمیل معتبر نیست";
    }

    if (!form.password.trim()) newErrors.password = "رمز عبور را وارد کنید";

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "تکرار رمز عبور را وارد کنید";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "رمز عبور یکسان نیست";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {

    if (!validate()) return;

    try {

      await registerStudent({
        first_name: form.firstName,
        last_name: form.lastName,
        username: form.username,
        email: form.email.trim(),
        password: form.password,
        student_id: form.studentId,
      });

      showToast("ثبت‌نام با موفقیت انجام شد", "success");

      navigate("/login");

    } catch (error: any) {

      console.error(error);

      const serverError: string | undefined = error?.response?.data?.error;

      const fieldErrorMap: Record<string, keyof RegisterForm> = {
        "Username already exists": "username",
        "Student ID already exists": "studentId",
        "Email already exists": "email",
        "Invalid email address": "email",
        "Password must be at least 6 characters long": "password",
      };

      const messageMap: Record<string, string> = {
        "Username already exists": "این نام کاربری قبلاً ثبت شده است",
        "Student ID already exists": "این شماره دانشجویی قبلاً ثبت شده است",
        "Email already exists": "این ایمیل قبلاً ثبت شده است",
        "Invalid email address": "ایمیل معتبر نیست",
        "Password must be at least 6 characters long": "رمز عبور باید حداقل ۶ کاراکتر باشد",
      };

      if (serverError && fieldErrorMap[serverError]) {
        const field = fieldErrorMap[serverError];
        setErrors((prev) => ({ ...prev, [field]: messageMap[serverError] }));
        showToast(messageMap[serverError], "error");
      } else if (serverError) {
        showToast(messageMap[serverError] ?? serverError, "error");
      } else {
        showToast("ثبت‌نام انجام نشد", "error");
      }
    }
  };

  return (
    <div className="register-page">

      <div className="register-content">

        <div className="input-group">
          <input
            type="text"
            name="firstName"
            placeholder="نام"
            autoComplete="given-name"
            value={form.firstName}
            onChange={handleChange}
          />
          {errors.firstName && (
            <p className="error-text">{errors.firstName}</p>
          )}
        </div>

        <div className="input-group">
          <input
            type="text"
            name="lastName"
            placeholder="نام خانوادگی"
            autoComplete="family-name"
            value={form.lastName}
            onChange={handleChange}
          />
          {errors.lastName && (
            <p className="error-text">{errors.lastName}</p>
          )}
        </div>

        <div className="input-group">
          <input
            type="text"
            name="studentId"
            placeholder="شماره دانشجویی"
            value={form.studentId}
            onChange={handleChange}
          />
          {errors.studentId && (
            <p className="error-text">{errors.studentId}</p>
          )}
        </div>

        <div className="input-group">
          <input
            type="text"
            name="username"
            placeholder="نام کاربری"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
          />
          {errors.username && (
            <p className="error-text">{errors.username}</p>
          )}
        </div>

        <div className="input-group">
          <input
            type="email"
            name="email"
            placeholder="ایمیل (برای بازیابی رمز عبور)"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && (
            <p className="error-text">{errors.email}</p>
          )}
        </div>

        <div className="input-group">
          <input
            type="password"
            name="password"
            placeholder="رمز عبور"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password && (
            <p className="error-text">{errors.password}</p>
          )}
        </div>

        <div className="input-group">
          <input
            type="password"
            name="confirmPassword"
            placeholder="تکرار رمز عبور"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <p className="error-text">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          className="register-button"
          onClick={handleRegister}
        >
          ثبت‌نام
        </button>

        <p className="login-link">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <a
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/login")}
          >
            وارد شوید
          </a>
        </p>

      </div>

    </div>
  );
}
