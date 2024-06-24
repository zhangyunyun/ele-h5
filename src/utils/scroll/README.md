MScroll
● Options：用于处理和生成默认配置
● Scroller：用于处理滚动的逻辑
  ○ Animater
    ■ Transition：用于实现元素移动
      ● move(endPoint, time, easingFn)：设置目标位置，transition，translate 等信息，开始移动元素，期间触发各种 hooks 事件
      ● setPending(pending)：设置是否移动中，pending 为 true 则移动中
      ● transitionTime(time)：设置 transitionDuration 时间
      ● translate(point)：设置目标位置
      ● doStop()：停止移动
  ○ Actions：管理滚动动作的逻辑(依赖注入)
    ■ ActionsHandler：用于绑定 wrapper 元素的 touch 事件
    ■ Behavior：用于处理纵向或横向坐标方向上的划动行为的逻辑
      ● minScrollPos：最小能移动到的位置，一般为 0
      ● maxScrollPos：最大能移动到的位置，一般为负数
      ● resetStartPos()：重置开始位置
      ● getCurrentPos()：获取当前位置
      ● move(delta)：移动元素一段 delta 距离
      ● updatePosition(pos)：更新位置
      ● checkInBoundary()：检查是否越界
      ● end：计算划动后的最终位置（动量计算后的位置和时间）
