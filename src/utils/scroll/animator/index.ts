import { Transition } from './Transition'

export interface IPoint {
  x: number
  y: number
}

export { Transition as Animater }

export default function createAnimater(content: HTMLElement) {
  return new Transition(content)
}
