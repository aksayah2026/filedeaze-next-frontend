import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a date for display, e.g. "10 Jul 2026". Returns '—' for null/undefined/invalid input. */
export function formatDate(date: string | Date | null | undefined, fmt = 'DD MMM YYYY'): string {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.format(fmt) : '—';
}

/** Formats a date + time for display, e.g. "10 Jul 2026, 14:30". Returns '—' for null/undefined/invalid input. */
export function formatDateTime(date: string | Date | null | undefined, fmt = 'DD MMM YYYY, HH:mm'): string {
  return formatDate(date, fmt);
}

/** Formats a number as Indian Rupees, e.g. "₹1,234". Returns '₹0' for null/undefined/NaN input. */
export function formatCurrency(amount: number | string | null | undefined): string {
  const n = Number(amount);
  return `₹${(Number.isFinite(n) ? n : 0).toLocaleString()}`;
}

/** Extracts a user-friendly message from an Axios/fetch error, with a status-aware fallback. */
export function getErrorMessage(error: unknown): string {
  const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string; code?: string } | undefined;
  const serverMessage = err?.response?.data?.message;
  if (serverMessage) return serverMessage;

  const status = err?.response?.status;
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return "You don't have permission to view this.";
  if (status === 404) return 'The requested data could not be found.';
  if (status && status >= 500) return 'The server ran into a problem. Please try again in a moment.';
  if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message ?? '')) return 'The request timed out. Please check your connection and try again.';
  if (err?.message === 'Network Error') return 'Unable to reach the server. Please check your internet connection.';
  return 'Something went wrong. Please try again.';
}
