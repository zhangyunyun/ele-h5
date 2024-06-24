import { EventEmitter } from './shared-utils/event'
import Scroller from './scroller/Scroller'
import { OptionsConstructor, type Options } from './Options'
import { ease } from './shared-utils/ease'

export class MScrollConstructor extends EventEmitter {
  content!: HTMLElement
  options!: OptionsConstructor
  scroller!: Scroller

  constructor(el: HTMLElement, options?: Options) {
    super(['beforeScrollStart', 'scrollStart', 'scroll', 'scrollEnd'])

    const wrapper = el
    if (!wrapper) {
      // eslint-disable-next-line no-console
      console.log('wrapper 不能为空')
      return
    }
    if (!this.setContent(wrapper)) {
      return
    }

    this.options = new OptionsConstructor().merge(options)
    this.init(wrapper)
  }

  private setContent(wrapper: HTMLElement) {
    const content = wrapper.children[0] as HTMLElement
    if (!content) {
      return false
    }
    this.content = content
    return true
  }
  private init(wrapper: HTMLElement) {
    this.scroller = new Scroller(wrapper, this.content, this.options)
    this.eventBubbling()
    const { startX, startY } = this.options
    this.scroller.scrollTo(startX, startY)
  }
  private eventBubbling() {
    const hooks = this.scroller.hooks
    Object.keys(this.eventTypes).forEach((event) => {
      hooks.on(hooks.eventTypes[event], (...args) => {
        this.emit(this.eventTypes[event], ...args)
      })
    })
  }

  scrollTo(x: number, y: number, time = 0, easing = ease.bounce) {
    this.scroller.scrollTo(x, y, time, easing)
  }

  destroy() {
    this.scroller.destroy()
  }
}

export function createMScroll(el: HTMLElement, options?: Options) {
  const ms = new MScrollConstructor(el, options)
  return ms
}
