import { z } from 'zod';

export const requiredString = (message = 'This field is required') =>
  z.string({ message }).trim().min(1, { message });

export const emailSchema = z
  .string({ message: 'Email is required' })
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const phoneSchema = z
  .string({ message: 'Phone number is required' })
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be at most 15 digits')
  .regex(/^\+?[0-9\s-]+$/, 'Invalid phone number format');

export const passwordSchema = z
  .string({ message: 'Password is required' })
  .min(8, 'Password must be at least 8 characters');

export const urlSchema = z
  .string({ message: 'URL is required' })
  .trim()
  .url('Invalid URL format');
