import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    "ngrok-skip-browser-warning": "true"
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

function hardLogout() {
  setAccessToken(null);
  sessionStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

api.interceptors.response.use(
  r => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original?._retry) {
      const rt = localStorage.getItem('refreshToken');
      if (!rt) { hardLogout(); return Promise.reject(error); }

      // Queue concurrent requests while a refresh is in flight
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (!token) { reject(error); return; }
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: rt });
        const { accessToken: newAt, refreshToken: newRt } = data.data.tokens;
        setAccessToken(newAt);
        sessionStorage.setItem('accessToken', newAt);
        localStorage.setItem('refreshToken', newRt);

        // Flush queue with new token
        refreshQueue.forEach(cb => cb(newAt));
        refreshQueue = [];

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAt}`;
        return api(original);
      } catch {
        refreshQueue.forEach(cb => cb(null));
        refreshQueue = [];
        hardLogout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 402) {
      const stored = localStorage.getItem('user');
      let role: string | null = null;
      try { role = stored ? JSON.parse(stored).role : null; } catch { /* ignore */ }
      const subscriptionPath = role === 'MANAGER' ? '/manager/subscription' : '/admin/subscription';
      if (!window.location.pathname.endsWith('/subscription')) {
        window.location.href = subscriptionPath;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
