import type { IPoint } from '../animator'

export const getTime =
  Date.now ||
  function getTime() {
    return new Date().getTime()
  }

export function between(n: number, min: number, max: number) {
  if (n < min) {
    return min
  }
  if (n > max) {
    return max
  }
  return n
}

export function isSamePoint(startPoint: IPoint, endPoint: IPoint) {
  return startPoint.x === endPoint.x && startPoint.y === endPoint.y
}

export function isUndef(v: unknown): boolean {
  return v === undefined || v === null
}
