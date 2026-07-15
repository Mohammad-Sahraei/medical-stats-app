import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Download,
  UserCircle,
  ClipboardList,
} from "lucide-react";
import "./StudentNavbar.scss";

export default function StudentNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    { id: "home", icon: <Home size={26} />, path: "/student/home" },
    { id: "courses", icon: <BookOpen size={26} />, path: "/student/courses" },
    { id: "exams", icon: <ClipboardList size={26} />, path: "/student/exams" },
    { id: "downloads", icon: <Download size={26} />, path: "/student/downloads" },
    { id: "profile", icon: <UserCircle size={26} />, path: "/student/profile" },
  ];

  return (
    <div className="student-navbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${pathname === tab.path ? "active" : ""}`}
          onClick={() => navigate(tab.path)}
        >
          {tab.icon}
        </button>
      ))}
    </div>
  );
}
