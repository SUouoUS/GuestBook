import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AVATAR_COLORS = [
  { bg: 'd1fae5', text: '064e3b' },
  { bg: 'cffafe', text: '164e63' },
  { bg: 'e0e7ff', text: '312e81' },
  { bg: 'fce7f3', text: '831843' },
  { bg: 'fef08a', text: '713f12' },
  { bg: 'ffedd5', text: '7c2d12' },
  { bg: 'ccfbf1', text: '115e59' },
  { bg: 'dbeafe', text: '1e3a8a' },
];

export const getAvatarTheme = (name: string) => {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};
