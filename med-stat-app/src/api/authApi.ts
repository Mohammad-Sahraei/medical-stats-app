import api from "./axios";

export const loginUser = async (username: string, password: string) => {
  const res = await api.post("/auth/login", {
    username,
    password,
  });

  return res.data;
};

export const registerStudent = async (data: {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  student_id: string;
  email: string;
}) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const refreshToken = async () => {
  const res = await api.post("/auth/refresh");
  return res.data;
};

export const getProtected = async () => {
  const res = await api.get("/auth/protected");
  return res.data;
};

export const getProfile = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const updateProfile = async (data: {
  first_name?: string;
  last_name?: string;
  student_id?: string;
  theme?: "light" | "dark";
  email?: string;
}) => {
  const res = await api.put("/auth/me", data);
  return res.data;
};

export const forgotPassword = async (username: string) => {
  const res = await api.post("/auth/forgot-password", { username });
  return res.data;
};

export const resetPassword = async (data: {
  username: string;
  code: string;
  new_password: string;
}) => {
  const res = await api.post("/auth/reset-password", data);
  return res.data;
};
