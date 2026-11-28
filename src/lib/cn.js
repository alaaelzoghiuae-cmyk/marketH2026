import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge class names — the shadcn/ui `cn` helper (kept separate from lib/utils.jsx). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
