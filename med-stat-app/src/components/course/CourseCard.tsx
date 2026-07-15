import "./CourseCard.scss";

interface CourseCardProps {
  title: string;
  description?: string;
  progress?: number;
  onClick?: () => void;
}

export default function CourseCard({
  title,
  description,
  progress = 0,
  onClick,
}: CourseCardProps) {
  const buttonLabel =
    progress >= 100
      ? "مرور دوباره"
      : progress > 0
      ? "ادامه یادگیری"
      : "شروع یادگیری";

  return (
    <div className="course-card" onClick={onClick}>
      <div className="course-card-header">
        <h3 className="course-card-title">{title}</h3>

        <span className="course-card-progress-number">
          {progress}%
        </span>
      </div>

      {description && (
        <p className="course-card-description">{description}</p>
      )}

      <div className="course-card-progress">
        <div
          className="course-card-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button className="course-card-btn">
        {buttonLabel}
      </button>
    </div>
  );
}
