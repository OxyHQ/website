import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Thousands-separated integer, e.g. `1234567` → `1,234,567`. */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

/** A date as `Jan 5, 2026`, in US English wherever it renders. */
export function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
