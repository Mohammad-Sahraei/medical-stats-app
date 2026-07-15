import { useNavigate } from "react-router-dom";
import "./AddCourse.scss";

export default function AddCourse() {
  const navigate = useNavigate();

  return (
    <div className="add-course-page">
      <div className="add-course-options">
        <button
          type="button"
          className="add-course-card"
          onClick={() => navigate("/professor/add/lesson")}
        >
          <span className="add-course-card-title">افزودن درسنامه جدید</span>
          <span className="add-course-card-desc">
            ایجاد درسنامه شامل متن و مثال‌ها
          </span>
        </button>

        <button
          type="button"
          className="add-course-card"
          onClick={() => navigate("/professor/courses")}
        >
          <span className="add-course-card-title">افزودن آزمون جدید</span>
          <span className="add-course-card-desc">
            ابتدا فصل موردنظر را انتخاب کنید، سپس آزمون بسازید
          </span>
        </button>

        <button
          type="button"
          className="add-course-card"
          onClick={() => navigate("/professor/add/file")}
        >
          <span className="add-course-card-title">افزودن فایل PDF</span>
          <span className="add-course-card-desc">
            ضمیمه کردن جزوه یا فایل به یک فصل یا آزمون موجود
          </span>
        </button>
      </div>
    </div>
  );
}
