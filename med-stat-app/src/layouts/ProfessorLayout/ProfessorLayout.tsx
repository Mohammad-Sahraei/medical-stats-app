import { Outlet } from "react-router-dom";
import ProfessorNavbar from "../../components/navbar/ProfessorNavbar";
import AppHeader from "../../components/header/AppHeader";
import "./ProfessorLayout.scss";

export default function ProfessorLayout() {
  return (
    <div className="prof-layout">
      <AppHeader />

      <div className="content">
        <Outlet />
      </div>

      <ProfessorNavbar />
    </div>
  );
}
