import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

const loginPath = () => {
  if (typeof window === 'undefined') return '/admin/login';
  const p = window.location.pathname;
  if (p.startsWith('/super-admin')) return '/super-admin/login';
  if (p.startsWith('/manager')) return '/manager/login';
  return '/admin/login';
};

api.interceptors.response.use(
  r => r,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setAccessToken(null);
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = loginPath();
    }
    return Promise.reject(error);
  }
);

export default api;
