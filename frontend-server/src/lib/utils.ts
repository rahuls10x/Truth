import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(prefix = ''): string {
  const id = Math.random().toString(36).slice(2, 9) + Math.random().toString(36).slice(2, 9);
  return prefix ? `${prefix}_${id}` : id;
}