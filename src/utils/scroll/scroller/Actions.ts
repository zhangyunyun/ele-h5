import type { Animater } from '../animator'
import type ActionsHanlder from '../base/ActionsHanlder'
import type Behavior from './Behavior'
import type { Options } from '../Options'
import { EventEmitter } from '../shared-utils/event'
import type { IPoint } from '../animator'
import { getTime, between } from '../shared-utils/lang'

export default class ScrollerActions {
  hooks: EventEmitter
  enabled: boolean
  contentMoved!: boolean
  startTime!: number
  endTime!: number

  constructor(
    public scrollBehaviorX: Behavior,
    public scrollBehaviorY: Behavior,
    public actionsHandler: ActionsHanlder,
    public animater: Animater,
    public options: Options
  ) {
    this.hooks = new EventEmitter(['start', 'scrollStart', 'scroll', 'scrollEnd'])
    this.enabled = true
    this.bindActionsHandler()
  }

  private bindActionsHandler() {
    const eventTypes = [
      { event: 'start', handler: this.handleStart.bind(this) },
      { event: 'move', handler: this.handleMove.bind(this) },
      { event: 'end', handler: this.handleEnd.bind(this) },
    ]
    const hooks = this.actionsHandler.hooks
    eventTypes.forEach(({ event, handler }) => {
      hooks.on(hooks.eventTypes[event], (...args: [number & TouchEvent, number & TouchEvent]) => {
        if (!this.enabled) {
          return true
        }
        return handler(...args)
      })
    })
  }

  private handleStart() {
    this.contentMoved = false
    this.startTime = getTime()

    // 强制停止滚动
    this.animater.doStop()
    // 更新开始位置为当前位置
    this.scrollBehaviorX.resetStartPos()
    this.scrollBehaviorY.resetStartPos()
    this.hooks.emit(this.hooks.eventTypes.start, this.getCurrentPos())
  }

  private handleMove(deltaX: number, deltaY: number) {
    const prevX = this.scrollBehaviorX.getCurrentPos()
    const prevY = this.scrollBehaviorY.getCurrentPos()
    // 获取 X、Y 新坐标
    const newX = this.scrollBehaviorX.move(deltaX)
    const newY = this.scrollBehaviorX.move(deltaY)
    // 判断位置是否改变
    const positionChanged = newX !== prevX || newY !== prevY

    // 如果容器未移动，且位置发生改变，则是开始滚动阶段
    if (!this.contentMoved && positionChanged) {
      this.contentMoved = true
      this.hooks.emit(this.hooks.eventTypes.scrollStart, this.getCurrentPos())
    }
    // 如果容器正在移动，且位置发生改变，则是正在滚动阶段
    if (this.contentMoved && positionChanged) {
      this.animater.translate({
        x: newX,
        y: newY,
      })
    }
    this.hooks.emit(this.hooks.eventTypes.scroll, this.getCurrentPos())
  }

  private handleEnd(e: TouchEvent) {
    let currentPos = this.getCurrentPos()
    // 暴露一个 end 事件，外部可以通过监听 end 事件来实现禁止滚动
    if (this.hooks.emit(this.hooks.eventTypes.end, e, currentPos)) {
      return true
    }
    currentPos = this.ensureIntegerPos(currentPos)
    this.animater.translate(currentPos)
    this.endTime = getTime()
    const duration = this.endTime - this.startTime
    this.hooks.emit(this.hooks.eventTypes.scrollEnd, currentPos, duration)
  }

  // 保证坐标为有效坐标
  private ensureIntegerPos(currentPos: IPoint) {
    let { x, y } = currentPos
    x = x > 0 ? Math.ceil(x) : Math.floor(x)
    y = y > 0 ? Math.ceil(y) : Math.floor(y)
    x = between(x, this.scrollBehaviorX.maxScrollPos, this.scrollBehaviorX.minScrollPos)
    y = between(y, this.scrollBehaviorY.maxScrollPos, this.scrollBehaviorY.minScrollPos)
    return { x, y }
  }

  getCurrentPos() {
    return {
      x: this.scrollBehaviorX.getCurrentPos(),
      y: this.scrollBehaviorY.getCurrentPos(),
    }
  }

  destroy() {
    this.hooks.destroy()
  }
}
