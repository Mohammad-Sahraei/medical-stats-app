import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const roleHome: Record<string, string> = {
  student: "/student/courses",
  professor: "/professor/add",
  admin: "/professor/add",
};

interface Props {
  role: "student" | "professor";
  children: React.ReactNode;
}

export default function RequireRole({ role, children }: Props) {
  const auth = useContext(AuthContext);

  // Wait for AuthContext to finish restoring the session from localStorage
  // before deciding — otherwise a page refresh briefly bounces logged-in
  // users to /login before their token has been decoded.
  if (auth?.loading) {
    return null;
  }

  if (!auth?.user) {
    return <Navigate to="/login" replace />;
  }

  if (auth.user.role !== role) {
    return <Navigate to={roleHome[auth.user.role] || "/login"} replace />;
  }

  return <>{children}</>;
}
