import { cancelRAF, rAF } from '@/utils/raf'
import type { IPoint } from './index'
import { EventEmitter } from '../shared-utils/event'

export class Transition {
  hooks
  content!: HTMLElement
  style!: CSSStyleDeclaration
  pending!: boolean
  timer = 0

  constructor(content: HTMLElement) {
    this.hooks = new EventEmitter(['beforeTranslate', 'translate', 'move', 'end'])
    this.setContent(content)
  }

  private setContent(content: HTMLElement) {
    if (content !== this.content) {
      this.content = content
      this.style = content.style as CSSStyleDeclaration
    }
  }
  private getComputedPosition() {
    const cssStyle = window.getComputedStyle(this.content, null) as CSSStyleDeclaration

    const _matrix = cssStyle['transform'].split(')')[0].split(', ')
    const x = +(_matrix[12] || _matrix[4]) || 0
    const y = +(_matrix[13] || _matrix[5]) || 0
    return { x, y }
  }
  private startStep() {
    const step = () => {
      const pos = this.getComputedPosition()
      this.hooks.emit(this.hooks.eventTypes.move, pos)

      if (this.pending) {
        this.timer = rAF(step)
      } else {
        this.hooks.emit(this.hooks.eventTypes.end, pos)
      }
    }

    cancelRAF(this.timer)
    step()
  }

  setPending(pending: boolean) {
    this.pending = pending
  }
  transitionTimingFunction(easing: string) {
    this.style['transitionTimingFunction'] = easing
  }
  transitionTime(time = 0) {
    this.style['transitionDuration'] = `${time}ms`
  }
  translate(point: IPoint) {
    const { x, y } = point
    this.hooks.emit(this.hooks.eventTypes.beforeTranslate, point)
    this.style['transform'] = `traslate(${x}px, ${y}px)`
    this.hooks.emit(this.hooks.eventTypes.translate, point)
  }
  move(endPoint: IPoint, time: number, easingFn: string) {
    this.setPending(time > 0)
    this.transitionTimingFunction(easingFn)
    this.transitionTime(time)
    this.translate(endPoint)

    this.startStep()
  }
  doStop() {
    const pending = this.pending
    if (pending) {
      this.setPending(false)
      const { x, y } = this.getComputedPosition()
      this.transitionTime()
      this.translate({ x, y })
    }
  }
  destroy() {
    this.hooks.destroy()
    cancelRAF(this.timer)
  }
}
