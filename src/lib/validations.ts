import { z } from 'zod';

export const requiredString = (message = 'This field is required') =>
  z.string({ required_error: message, invalid_type_error: message }).trim().min(1, { message });

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const phoneSchema = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must be at most 15 digits')
  .regex(/^\+?[0-9\s-]+$/, 'Invalid phone number format');

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters');

export const urlSchema = z
  .string({ required_error: 'URL is required' })
  .trim()
  .url('Invalid URL format');
