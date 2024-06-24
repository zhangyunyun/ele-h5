import type { Options } from '../Options'
import { createBehaviorOptions } from '../Options'
import type { IPoint } from '../animator'
import createAnimater from '../animator'
import ActionsHanlder from '../base/ActionsHanlder'
import { ease } from '../shared-utils/ease'
import { isSamePoint, isUndef } from '../shared-utils/lang'
import { EventEmitter, EventRegister } from '../shared-utils/event'
import ScrollerActions from './Actions'
import Behavior from './Behavior'

const MIN_SCROLL_DISTANCE = 1

export default class Scroller {
  hooks
  scrollBehaviorX
  scrollBehaviorY
  actionsHandler
  animater
  actions
  transitionEndRegister!: EventRegister

  constructor(public wrapper: HTMLElement, public content: HTMLElement, public options: Options) {
    this.hooks = new EventEmitter(['beforeScroll', 'scrollStart', 'scroll', 'end', 'scrollEnd'])
    const { left, right, top, bottom } = options.bounce as any
    this.scrollBehaviorX = new Behavior(
      wrapper,
      content,
      createBehaviorOptions(options, 'scrollX', [left, right], {
        size: 'width',
      })
    )
    this.scrollBehaviorY = new Behavior(
      wrapper,
      content,
      createBehaviorOptions(options, 'scrollY', [top, bottom], {
        size: 'height',
      })
    )
    this.actionsHandler = new ActionsHanlder(this.wrapper)
    this.animater = createAnimater(content)
    this.actions = new ScrollerActions(
      this.scrollBehaviorX,
      this.scrollBehaviorY,
      this.actionsHandler,
      this.animater,
      this.options
    )

    // 用于处理惯性划动到边缘时，列表回弹效果
    this.registerTransitionEnd()
    this.init()
  }

  private registerTransitionEnd() {
    this.transitionEndRegister = new EventRegister(this.content, [
      {
        name: 'transitionend',
        handler: this.transitionEnd.bind(this),
      },
    ])
  }
  private transitionEnd(e: TouchEvent) {
    // 如果 transition 动画不是容器触发，或者动画未进行中，则返回
    if (e.target !== this.content || !this.animater.pending) {
      return
    }
    this.animater.transitionTime()
    // 判断当前位置是否越界，如果越界则重置
    if (this.resetPosition(this.options.bounceTime, ease.bounce)) {
      return
    }
    this.animater.setPending(false)
    this.hooks.emit(this.hooks.eventTypes.scrollEnd, this.getCurrentPos())
  }
  private init() {
    this.bindAnimater()
    this.bindActions()
  }
  private bindAnimater() {
    const hooks = this.animater.hooks
    hooks.on(hooks.eventTypes.translate, (pos: IPoint) => {
      this.updatePositions(pos)
    })
    hooks.on(hooks.eventTypes.move, (pos: IPoint) => {
      this.hooks.emit(this.hooks.eventTypes.scroll, pos)
    })
    hooks.on(hooks.eventTypes.end, (pos: IPoint) => {
      this.animater.setPending(false)
      this.hooks.emit(this.hooks.eventTypes.scrollEnd, pos)
    })
  }
  private bindActions() {
    const hooks = this.actions.hooks
    hooks.on(hooks.eventTypes.start, (pos: IPoint) => {
      this.hooks.emit(this.hooks.eventTypes.beforeScroll, pos)
    })
    hooks.on(hooks.eventTypes.scrollStart, (pos: IPoint) => {
      this.hooks.emit(this.hooks.eventTypes.scrollStart, pos)
    })
    hooks.on(hooks.eventTypes.scroll, (pos: IPoint) => {
      this.hooks.emit(this.hooks.eventTypes.scroll, pos)
    })
    hooks.on(hooks.eventTypes.end, (pos: IPoint) => {
      if (this.hooks.emit(this.hooks.eventTypes.end, pos)) {
        return
      }
      // 判断当前位置是否越界，如果越界则重置
      if (this.resetPosition(this.options.bounceTime, ease.bounce)) {
        return true
      }
    })
    hooks.on(hooks.eventTypes.scrollEnd, (pos: IPoint, duration: number) => {
      if (this.momentum(pos, duration)) {
        return
      }
      if (this.actions.contentMoved) {
        this.hooks.emit(this.hooks.eventTypes.scrollEnd, pos)
      }
    })
  }
  private resetPosition(time = 0, easing = ease.bounce) {
    const { position: x, inBoundary: xInBoundary } = this.scrollBehaviorX.checkInBoundary()
    const { position: y, inBoundary: yInBoundary } = this.scrollBehaviorY.checkInBoundary()

    // 如果都未越界了，则返回 false
    if (xInBoundary && yInBoundary) {
      return false
    }
    // 如果越界了，则使用边界动画滚动到边界
    this.scrollTo(x, y, time, easing)

    return true
  }

  private momentum(pos: IPoint, duration: number) {
    const meta = {
      time: 0,
      easing: ease.swipe,
      newX: pos.x,
      newY: pos.y,
    }
    // start momentum animation if needed
    const momentumX = this.scrollBehaviorX.end(duration)
    const momentumY = this.scrollBehaviorY.end(duration)

    meta.newX = isUndef(momentumX.destination) ? meta.newX : (momentumX.destination as number)

    meta.newY = isUndef(momentumY.destination) ? meta.newY : (momentumY.destination as number)
    meta.time = Math.max(momentumX.duration as number, momentumY.duration as number)
    // when x or y changed, do momentum animation now
    if (meta.newX !== pos.x || meta.newY !== pos.y) {
      // change easing function when scroller goes out of the boundaries
      if (
        meta.newX > this.scrollBehaviorX.minScrollPos ||
        meta.newX < this.scrollBehaviorX.maxScrollPos ||
        meta.newY > this.scrollBehaviorY.minScrollPos ||
        meta.newY < this.scrollBehaviorY.maxScrollPos
      ) {
        meta.easing = ease.swipeBounce
      }
      this.scrollTo(meta.newX, meta.newY, meta.time, meta.easing)
      return true
    }
  }

  scrollTo(x: number, y: number, time = 0, easing = ease.bounce) {
    const currentPos = this.getCurrentPos()
    const startPoint = {
      x: currentPos.x,
      y: currentPos.y,
    }
    const endPoint = {
      x,
      y,
    }
    // 位置未改变，则直接返回
    if (isSamePoint(startPoint, endPoint)) {
      return
    }
    // 如果移动距离未超过预定值，则直接移动
    const deltaX = Math.abs(endPoint.x - startPoint.x)
    const deltaY = Math.abs(endPoint.y - startPoint.y)
    if (deltaX < MIN_SCROLL_DISTANCE && deltaY < MIN_SCROLL_DISTANCE) {
      time = 0
    }
    this.animater.move(endPoint, time, easing.style)
  }
  getCurrentPos() {
    return this.actions.getCurrentPos()
  }
  updatePositions(pos: IPoint) {
    this.scrollBehaviorX.updatePosition(pos.x)
    this.scrollBehaviorY.updatePosition(pos.y)
  }

  destroy() {
    this.hooks.destroy()
    this.actionsHandler.destroy()
    this.animater.destroy()
    this.actions.destroy()
    this.transitionEndRegister.destroy()
  }
}
