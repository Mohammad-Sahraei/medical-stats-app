import { useNavigate, useLocation } from "react-router-dom";
import { Plus, List, Users, UserCircle } from "lucide-react";
import "./ProfessorNavbar.scss";

export default function ProfessorNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

const tabs = [
  { id: "add", icon: <Plus size={26} />, path: "/professor/add" },
  { id: "list", icon: <List size={26} />, path: "/professor/courses" },
  { id: "students", icon: <Users size={26} />, path: "/professor/students" },
  { id: "profile", icon: <UserCircle size={26} />, path: "/professor/profile" },
];


  return (
    <div className="prof-navbar">
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
