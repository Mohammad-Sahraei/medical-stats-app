import { createContext, useState, useEffect } from "react";
import { loginUser } from "../api/authApi";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (token) {
      try {

        const decoded: any = jwtDecode(token);

        setUser({
          id: decoded.sub,
          role: decoded.role,
          token: token
        });

      } catch {
        localStorage.removeItem("token");
      }
    }

    setLoading(false);

  }, []);

  const login = async (username: string, password: string) => {

    const data = await loginUser(username, password);

    const token = data.access_token;

    const decoded: any = jwtDecode(token);

    const userData = {
      role: decoded.role,
      id: decoded.sub,
      token: token
    };

    localStorage.setItem("token", token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }

    setUser(userData);

    return userData;
  };

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
