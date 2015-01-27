//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;
(function ($) {
    var touch = {},
        touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
        longTapDelay = 750,
        gesture

    // 判断滑动方向
    function swipeDirection(x1, x2, y1, y2) {
        // x1 - x2 的 绝对值比 (y1-y2) 则说明方向为左右相仿
        // x1 - x2 > 0 则说明方向为向左
        return Math.abs(x1 - x2) >=
        Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
    }

    // 长按
    function longTap() {
        longTapTimeout = null
        if (touch.last) {
            touch.el.trigger('longTap')
            touch = {}
        }
    }

    // 取消长按
    function cancelLongTap() {
        if (longTapTimeout) clearTimeout(longTapTimeout)
        longTapTimeout = null
    }

    // 取消所有触摸事件
    function cancelAll() {
        // 触摸
        if (touchTimeout) clearTimeout(touchTimeout)
        // 点击
        if (tapTimeout) clearTimeout(tapTimeout)
        // 滑动
        if (swipeTimeout) clearTimeout(swipeTimeout)
        // 长按
        if (longTapTimeout) clearTimeout(longTapTimeout)

        // 清空定时器
        touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
        // 清空事件队列
        touch = {}
    }

    // 判断是否未优先级高的触摸事件
    function isPrimaryTouch(event) {
        return (event.pointerType == 'touch' ||
            event.pointerType == event.MSPOINTER_TYPE_TOUCH)
            // 注意这个 isPrimary 属性
            && event.isPrimary
    }

    // 判断是否为指针事件类型
    function isPointerEventType(e, type) {
        return (e.type == 'pointer' + type ||
        e.type.toLowerCase() == 'mspointer' + type)
    }

    $(document).ready(function () {
        var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType

        if ('MSGesture' in window) {
            // 神奇的 IE 手势
            gesture = new MSGesture()
            gesture.target = document.body
        }

        // 将事件委托到 document 下
        $(document)
            .bind('MSGestureEnd', function (e) {
                // 绑定 IE 私有的手势事件
                var swipeDirectionFromVelocity =
                    // 直接提供了滑动方向, 真好
                    e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null;
                if (swipeDirectionFromVelocity) {
                    touch.el.trigger('swipe')
                    touch.el.trigger('swipe' + swipeDirectionFromVelocity)
                }
            })
            // 这里绑定了三个移动端的事件, 并不包括 PC 端的 mousedown 事件, 不兼容 PC
            .on('touchstart MSPointerDown pointerdown', function (e) {
                // 如果 e 是形如 pointerdown 或 MSPointerdown 的事件对象, 并且不是高优先级的事件, 则直接返回不做处理
                if ((_isPointerType = isPointerEventType(e, 'down')) && !isPrimaryTouch(e)) return

                // 如果 e 不是 IE 私有或高优先级事件对象, 则继续处理
                // 可能是多点触摸, 获取到第一个触摸点对应的对象
                firstTouch = _isPointerType ? e : e.touches[0]
                if (e.touches && e.touches.length === 1 && touch.x2) {
                    // Clear out touch movement data if we have it sticking around
                    // This can occur if touchcancel doesn't fire due to preventDefault, etc.
                    touch.x2 = undefined
                    touch.y2 = undefined
                }
                now = Date.now()

                // 获取第一次与最后一次点击的时间间隔
                delta = now - (touch.last || now)

                // 获取到事件对应的 DOM 元素
                touch.el = $('tagName' in firstTouch.target ?
                    // 如果自身元素不是,则寻找父亲元素
                    firstTouch.target : firstTouch.target.parentNode)
                touchTimeout && clearTimeout(touchTimeout)

                // 存储 touchstart 的坐标
                touch.x1 = firstTouch.pageX
                touch.y1 = firstTouch.pageY

                // 如果存在时间间隔且小于 250ms 的话, 说明是双击事件
                if (delta > 0 && delta <= 250) touch.isDoubleTap = true

                touch.last = now

                // 设置长按定时器
                longTapTimeout = setTimeout(longTap, longTapDelay)
                // adds the current touch contact for IE gesture recognition
                if (gesture && _isPointerType) gesture.addPointer(e.pointerId);
            })
            .on('touchmove MSPointerMove pointermove', function (e) {
                if ((_isPointerType = isPointerEventType(e, 'move')) && !isPrimaryTouch(e)) return
                firstTouch = _isPointerType ? e : e.touches[0]

                // 发生了 touchmove 则取消长按定时器
                cancelLongTap()
                touch.x2 = firstTouch.pageX
                touch.y2 = firstTouch.pageY

                deltaX += Math.abs(touch.x1 - touch.x2)
                deltaY += Math.abs(touch.y1 - touch.y2)
            })
            .on('touchend MSPointerUp pointerup', function (e) {
                if ((_isPointerType = isPointerEventType(e, 'up')) && !isPrimaryTouch(e)) return

                // 发生了 touchend, 再次取消长按定时器, 以防万一
                cancelLongTap()

                // swipe
                // 发生了 touchmove 且移动的距离大于 30px, 被认为发生了滑动事件
                if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
                    (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

                    // 这里设置的定时器为 0, 意义在于如果这个事件在队列里没被触发, 且需要取消时, 还能取消
                    swipeTimeout = setTimeout(function () {
                        // 触发滑动事件
                        touch.el.trigger('swipe')
                        // 触发具体方向的滑动时间
                        // 这里判断滑动方向的方法可谓是简单粗暴, 只有上下左右其中一个值
                        touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
                        // 事件触发完清空缓存
                        touch = {}
                    }, 0)

                // normal tap
                // touchmove 的距离小于 30 认为没有移动, 但存在 last touch 说明是双击
                else if ('last' in touch)
                // don't fire tap when delta position changed by more than 30 pixels,
                // for instance when moving to a point and back to origin
                    if (deltaX < 30 && deltaY < 30) {
                        // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
                        // ('tap' fires before 'scroll')
                        // 这里也设置了 0ms 的定时, 为了可以在 scroll 事件发生前取消它
                        tapTimeout = setTimeout(function () {

                            // trigger universal 'tap' with the option to cancelTouch()
                            // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                            var event = $.Event('tap')
                            event.cancelTouch = cancelAll
                            touch.el.trigger(event)

                            // trigger double tap immediately
                            // 判断是否为双击, 快速触发它
                            // 注意这里 isDoubleTap 为 true 的条件是, 双击的时间间隔小于 250ms
                            if (touch.isDoubleTap) {
                                if (touch.el) touch.el.trigger('doubleTap')
                                // 触发完记得清空缓存
                                touch = {}
                            }

                            // trigger single tap after 250ms of inactivity
                            // 双击时间大于 250ms 则认为是单击
                            else {
                                touchTimeout = setTimeout(function () {
                                    touchTimeout = null
                                    if (touch.el) touch.el.trigger('singleTap')
                                    touch = {}
                                }, 250)
                            }
                        }, 0)
                    } else {
                        touch = {}
                    }
                deltaX = deltaY = 0
            })
            // when the browser window loses focus,
            // for example when a modal dialog is shown,
            // cancel all ongoing events
            // 触摸事件被中断, 则取消所有事件
            .on('touchcancel MSPointerCancel pointercancel', cancelAll)

        // scrolling the window indicates intention of the user
        // to scroll, not tap or swipe, so cancel all ongoing events
        // 滚动事件发生时, 亦取消所有事件
        $(window).on('scroll', cancelAll)
    })

    ;
    ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
        'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function (eventName) {
            // 最后将这些自定义的触摸事件挂载到  $.fn 下
            $.fn[eventName] = function (callback) {
                return this.on(eventName, callback)
            }
        })
})(Zepto)
