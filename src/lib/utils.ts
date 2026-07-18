import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Thousands-separated integer, e.g. `1234567` → `1,234,567`. */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}
