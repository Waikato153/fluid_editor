import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function randomElement<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)]
}
// @ts-ignore
export const renderDate = date => {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()

  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${day}.${month}.${year} ${hours}:${minutes}`
}
export * from './cssVar'
export * from './getConnectionText'
export * from './getRenderContainer'
export * from './isCustomNodeSelected'
export * from './isTextSelected'
