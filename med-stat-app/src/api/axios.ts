import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

function clearSessionAndRedirect() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );
    const newToken = res.data.access_token;
    localStorage.setItem("token", newToken);
    return newToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isAuthRoute =
      config?.url?.includes("/auth/login") ||
      config?.url?.includes("/auth/refresh") ||
      config?.url?.includes("/auth/register");

    if (response?.status === 401 && config && !config._retried && !isAuthRoute) {
      config._retried = true;

      if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken().finally(() => {
          refreshInFlight = null;
        });
      }

      const newToken = await refreshInFlight;

      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      }

      clearSessionAndRedirect();
    }

    return Promise.reject(error);
  },
);

export default api;