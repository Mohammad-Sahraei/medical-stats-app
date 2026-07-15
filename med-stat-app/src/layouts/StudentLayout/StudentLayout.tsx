import { Outlet } from "react-router-dom";
import StudentNavbar from "../../components/navbar/StudentNavbar";
import AppHeader from "../../components/header/AppHeader";
import "./StudentLayout.scss";

export default function StudentLayout() {
  return (
    <div className="student-layout">
      <AppHeader />

      <div className="content">
        <Outlet />
      </div>

      <StudentNavbar />
    </div>
  );
}
