import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Save,
  Settings,
  LogOut,
  CalendarDays,
  UserCircle,
  Moon,
  Sun,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import IranianCalendar from "../calendar/IranianCalendar";

interface Field {
  key: string;
  label: string;
  type?: string;
  readOnly?: boolean;
}

interface Props {
  userTitle: string;
  subtitle?: string;

  isEditing: boolean;
  toggleEdit: () => void;

  fields: Field[];
  userData: any;
  handleChange: (key: string, value: string) => void;
}

export default function ProfileLayout({
  userTitle,
  subtitle,
  isEditing,
  toggleEdit,
  fields,
  userData,
  handleChange,
}: Props) {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => {
    auth?.logout();
    navigate("/login");
  };

  return (
    <div className="student-profile-page">

      <div className="profile-card">

        <div className="profile-header">
          <div className="user-info">
            <UserCircle size={58} />

            <div>
              <h2>{userTitle}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>

          <button className="edit-btn" onClick={toggleEdit}>
            {isEditing ? <Save size={20} /> : <Pencil size={20} />}
          </button>
        </div>

        <div className="profile-fields">

          {fields.map((field) => (
            <div className="field" key={field.key}>
              <label>{field.label}</label>

              <input
                type={field.type || "text"}
                disabled={field.readOnly || !isEditing}
                value={userData[field.key] ?? ""}
                onChange={(e) =>
                  handleChange(field.key, e.target.value)
                }
              />
            </div>
          ))}

        </div>
      </div>

      {/* Calendar */}

      <div className="calendar-card">
        <div className="section-title">
          <CalendarDays size={18} />
          <h3>تقویم</h3>
        </div>

        <IranianCalendar />
      </div>

      {/* Settings */}

      <div className="settings-card">

        <button
          className="settings-item"
          onClick={() => setSettingsOpen((v) => !v)}
        >
          <Settings size={20} />
          <span>تنظیمات</span>
        </button>

        {settingsOpen && (
          <div className="settings-panel">

            <div className="theme-toggle">
              <span>
                {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                حالت {theme === "dark" ? "تیره" : "روشن"}
              </span>

              <button
                type="button"
                className={`theme-switch ${theme === "dark" ? "is-dark" : ""}`}
                onClick={toggleTheme}
                aria-label="تغییر حالت نمایش"
              >
                <span className="theme-switch-knob" />
              </button>
            </div>
          </div>
        )}

        <button className="settings-item logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>خروج از حساب</span>
        </button>

      </div>

    </div>
  );
}
