import { useContext, useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

import {
  gregorianToJalali,
  jalaliToGregorian,
  daysInJalaliMonth,
  firstWeekdayOfJalaliMonth,
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_LABELS,
  toPersianDigits,
} from "../../utils/jalali";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  getNotifications,
  saveNotification,
  deleteNotification,
  type Notification,
} from "../../api/notificationsApi";
import NotificationModal from "../notifications/NotificationModal";

import "./IranianCalendar.scss";

function toIsoDate(gy: number, gm: number, gd: number) {
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export default function IranianCalendar() {
  const auth = useContext(AuthContext);
  const { showToast } = useToast();
  const isProfessor = auth?.user?.role === "professor";

  const now = useMemo(() => new Date(), []);
  const [today_jy, today_jm, today_jd] = useMemo(
    () => gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate()),
    [now]
  );

  const [viewYear, setViewYear] = useState(today_jy);
  const [viewMonth, setViewMonth] = useState(today_jm);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    })();
  }, []);

  const notificationsByDate = useMemo(() => {
    const map = new Map<string, Notification>();
    notifications.forEach((n) => map.set(n.date, n));
    return map;
  }, [notifications]);

  const totalDays = daysInJalaliMonth(viewYear, viewMonth);
  const leadingBlanks = firstWeekdayOfJalaliMonth(viewYear, viewMonth);

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const activeNotification = activeDate ? notificationsByDate.get(activeDate) : undefined;

  const handleDayClick = (day: number) => {
    const [gy, gm, gd] = jalaliToGregorian(viewYear, viewMonth, day);
    const iso = toIsoDate(gy, gm, gd);

    if (!isProfessor && !notificationsByDate.has(iso)) return;

    setActiveDate(iso);
  };

  const handleSave = async (message: string) => {
    if (!activeDate || !message.trim()) return;

    try {
      setSaving(true);
      const saved = await saveNotification(activeDate, message.trim());
      setNotifications((prev) => [
        saved,
        ...prev.filter((n) => n.date !== saved.date),
      ]);
      showToast("پیام ذخیره شد", "success");
      setActiveDate(null);
    } catch (err) {
      console.error("Failed to save notification:", err);
      showToast("خطا در ذخیره پیام", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeNotification) return;

    try {
      setSaving(true);
      await deleteNotification(activeNotification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== activeNotification.id));
      showToast("پیام حذف شد", "success");
      setActiveDate(null);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      showToast("خطا در حذف پیام", "error");
    } finally {
      setSaving(false);
    }
  };

  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isCurrentMonth = viewYear === today_jy && viewMonth === today_jm;

  return (
    <div className="iranian-calendar">
      <div className="calendar-nav">
        <button type="button" onClick={goToNextMonth} aria-label="ماه بعد">
          <ChevronRight size={18} />
        </button>

        <span className="calendar-title">
          {JALALI_MONTH_NAMES[viewMonth - 1]} {toPersianDigits(viewYear)}
        </span>

        <button type="button" onClick={goToPrevMonth} aria-label="ماه قبل">
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {JALALI_WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((day, index) => {
          const iso = day
            ? toIsoDate(...jalaliToGregorian(viewYear, viewMonth, day))
            : null;
          const hasNotification = !!iso && notificationsByDate.has(iso);
          const clickable = day && (isProfessor || hasNotification);

          return (
            <span
              key={index}
              className={`calendar-cell ${
                day && isCurrentMonth && day === today_jd ? "today" : ""
              } ${day ? "" : "empty"} ${hasNotification ? "has-notification" : ""} ${
                clickable ? "clickable" : ""
              }`}
              onClick={() => day && clickable && handleDayClick(day)}
            >
              {day ? toPersianDigits(day) : ""}
            </span>
          );
        })}
      </div>

      {activeDate && (
        <NotificationModal
          dateLabel={(() => {
            const [gy, gm, gd] = activeDate.split("-").map(Number);
            const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
            return `${toPersianDigits(jd)} ${JALALI_MONTH_NAMES[jm - 1]} ${toPersianDigits(jy)}`;
          })()}
          initialMessage={activeNotification?.message || ""}
          readOnly={!isProfessor}
          saving={saving}
          onClose={() => setActiveDate(null)}
          onSave={isProfessor ? handleSave : undefined}
          onDelete={isProfessor && activeNotification ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
