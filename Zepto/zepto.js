//     Zepto.js
//     (c) 2010-2014 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto;
Zepto = (function () {
    var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
        document = window.document,
        elementDisplay = {}, classCache = {},
        cssNumber = {
            'column-count': 1,
            'columns': 1,
            'font-weight': 1,
            'line-height': 1,
            'opacity': 1,
            'z-index': 1,
            'zoom': 1
        },
    // 匹配 <div></div>  等单标签
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    // 匹配 <img /> 和 <hr > 等单标签
        singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    // 匹配 TODO 没看懂
        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
        rootNodeRE = /^(?:body|html)$/i,
        capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    // 必须通过方法来定义的属性
        methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    // 相邻操作符
        adjacencyOperators = ['after', 'prepend', 'before', 'append'],
        table = document.createElement('table'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': document.createElement('tbody'),
            'tbody': table, 'thead': table, 'tfoot': table,
            'td': tableRow, 'th': tableRow,
            '*': document.createElement('div')
        },
        readyRE = /complete|loaded|interactive/,
        simpleSelectorRE = /^[\w-]*$/,
        class2type = {},
        toString = class2type.toString,
        zepto = {},
        camelize, uniq,
        tempParent = document.createElement('div'),
        propMap = {
            'tabindex': 'tabIndex',
            'readonly': 'readOnly',
            'for': 'htmlFor',
            'class': 'className',
            'maxlength': 'maxLength',
            'cellspacing': 'cellSpacing',
            'cellpadding': 'cellPadding',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'usemap': 'useMap',
            'frameborder': 'frameBorder',
            'contenteditable': 'contentEditable'
        },
        isArray = Array.isArray ||
            function (object) {
                return object instanceof Array
            }

    zepto.matches = function (element, selector) {
        //nodeType === 1 时 表示是元素类型
        if (!selector || !element || element.nodeType !== 1) return false
        var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
            element.oMatchesSelector || element.matchesSelector
        if (matchesSelector) return matchesSelector.call(element, selector)
        // fall back to performing a selector:
        var match, parent = element.parentNode, temp = !parent
        if (temp) (parent = tempParent).appendChild(element)
        match = ~zepto.qsa(parent, selector).indexOf(element)
        temp && tempParent.removeChild(element)
        return match
    }

    function type (obj) {
        return obj == null ? String(obj) :
        class2type[toString.call(obj)] || "object"
    }

    function isFunction (value) {
        return type(value) == "function"
    }

    function isWindow (obj) {
        return obj != null && obj == obj.window
    }

    function isDocument (obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }

    function isObject (obj) {
        return type(obj) == "object"
    }

    function isPlainObject (obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }

    function likeArray (obj) {
        return typeof obj.length == 'number'
    }

    // 清除为 null 的数组元素
    function compact (array) {
        return filter.call(array, function (item) {
            return item != null
        })
    }


    // 拼接数组
    function flatten (array) {
        return array.length > 0 ? $.fn.concat.apply([], array) : array
    }

    // 将中划线连接的字符串驼峰化， 如 data-abc => dataAbc
    camelize = function (str) {
        return str.replace(/-+(.)?/g, function (match, chr) {
            return chr ? chr.toUpperCase() : ''
        })
    }

    // 将驼峰格式的字符串进行中划线化， 如 dataAbc => data-abc
    function dasherize (str) {
        return str.replace(/::/g, '/')
            // Abc => a_bc
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            // 5A => 5_A
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            // a_bc => a-bc
            // 5_A => 5-A
            .replace(/_/g, '-')
            // 5-A => 5-a
            .toLowerCase()
    }

    /**
     * 将数组中重复的元素剔除
     * @param array
     * @returns {Array.<T>}
     */
    uniq = function (array) {
        return filter.call(array, function (item, idx) {
            return array.indexOf(item) == idx
        })
    }

    /**
     * TODO 没看懂
     * @param name
     * @returns {*}
     */
    function classRE (name) {
        return name in classCache ?
            classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }

    /**
     * 判断是否需要自动加上 px 作为单位
     * cssNumber 中存放了不需要添加 px 作为参数的 css 属性
     * 若 name 不在 cssNumber 中，则说明需要自动加上 px 作为单位
     * @param name
     * @param value
     * @returns {string}
     */
    function maybeAddPx (name, value) {
        return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }

    /**
     *
     * 将 nodeName 对应的元素显示出来
     * @param nodeName
     * @returns {*}
     */
    function defaultDisplay (nodeName) {
        var element, display
        if (!elementDisplay[nodeName]) {
            // nodeName 不在缓存列表，则手动创建
            element = document.createElement(nodeName)
            // 创建后 append 到 body 中，再计算这个元素的 display 值
            // 为什么要插入呢？
            // 因为如果这个元素不在 DOM 中，我们需要生成这个元素插入后被浏览器渲染，
            // 然后使用 getComputedStyle 方法才能知道这元素在 CSS 中被设置的 display 值是什么
            document.body.appendChild(element)
            display = getComputedStyle(element, '').getPropertyValue("display")
            // 注意插入后获取到了这个元素的 display 默认属性后，手动将该元素删除
            element.parentNode.removeChild(element)
            // 若该元素默认被隐藏，则将其设置为 display: block
            // 注意如果该元素的 display 属性不为 node 但为其他值如 table-cell/inline-block 时， 并不改变这个元素的 display 属性为 block!
            display == "none" && (display = "block")

            // 将 nodeName 的 display 属性缓存起来
            elementDisplay[nodeName] = display
        }
        return elementDisplay[nodeName]
    }

    /**
     * 将 element 的子元素列表转化为数组
     * @param element
     * @returns {Array.<T>}
     */
    function children (element) {
        return 'children' in element ?
            slice.call(element.children) :
            $.map(element.childNodes, function (node) {
                //nodeType == 1 表示节点类型为 ELEMENT_NODE
                if (node.nodeType == 1) return node
            })
    }

    // `$.zepto.fragment` takes a html string and an optional tag name
    // to generate DOM nodes nodes from the given html string.
    // The generated DOM nodes are returned as an array.
    // This function can be overriden in plugins for example to make
    // it compatible with browsers that don't support the DOM fully.
    /**
     * TODO 没看懂
     * @param html
     * @param name
     * @param properties
     * @returns {*}
     */
    zepto.fragment = function (html, name, properties) {
        var dom, nodes, container

        // A special case optimization for a single tag
        if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

        if (!dom) {
            if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
            if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
            if (!(name in containers)) name = '*'

            container = containers[name]
            container.innerHTML = '' + html
            dom = $.each(slice.call(container.childNodes), function () {
                container.removeChild(this)
            })
        }

        if (isPlainObject(properties)) {
            nodes = $(dom)
            $.each(properties, function (key, value) {
                if (methodAttributes.indexOf(key) > -1) nodes[key](value)
                else nodes.attr(key, value)
            })
        }

        return dom
    }

    // `$.zepto.Z` swaps out the prototype of the given `dom` array
    // of nodes with `$.fn` and thus supplying all the Zepto functions
    // to the array. Note that `__proto__` is not supported on Internet
    // Explorer. This method can be overriden in plugins.
    zepto.Z = function (dom, selector) {
        dom = dom || []
        dom.__proto__ = $.fn
        dom.selector = selector || ''
        return dom
    }

    // `$.zepto.isZ` should return `true` if the given object is a Zepto
    // collection. This method can be overriden in plugins.
    zepto.isZ = function (object) {
        return object instanceof zepto.Z
    }

    // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
    // takes a CSS selector and an optional context (and handles various
    // special cases).
    // This method can be overriden in plugins.
    zepto.init = function (selector, context) {
        var dom
        // If nothing given, return an empty Zepto collection
        if (!selector) return zepto.Z()
        // Optimize for string selectors
        else if (typeof selector == 'string') {
            selector = selector.trim()
            // If it's a html fragment, create nodes from it
            // Note: In both Chrome 21 and Firefox 15, DOM error 12
            // is thrown if the fragment doesn't begin with <
            if (selector[0] == '<' && fragmentRE.test(selector))
                dom = zepto.fragment(selector, RegExp.$1, context), selector = null
            // If there's a context, create a collection on that context first, and select
            // nodes from there
            else if (context !== undefined) return $(context).find(selector)
            // If it's a CSS selector, use it to select nodes.
            else dom = zepto.qsa(document, selector)
        }
        // If a function is given, call it when the DOM is ready
        else if (isFunction(selector)) return $(document).ready(selector)
        // If a Zepto collection is given, just return it
        else if (zepto.isZ(selector)) return selector
        else {
            // normalize array if an array of nodes is given
            if (isArray(selector)) dom = compact(selector)
            // Wrap DOM nodes.
            else if (isObject(selector))
                dom = [selector], selector = null
            // If it's a html fragment, create nodes from it
            else if (fragmentRE.test(selector))
                dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
            // If there's a context, create a collection on that context first, and select
            // nodes from there
            else if (context !== undefined) return $(context).find(selector)
            // And last but no least, if it's a CSS selector, use it to select nodes.
            else dom = zepto.qsa(document, selector)
        }
        // create a new Zepto collection from the nodes found
        return zepto.Z(dom, selector)
    }

    // `$` will be the base `Zepto` object. When calling this
    // function just call `$.zepto.init, which makes the implementation
    // details of selecting nodes and creating Zepto collections
    // patchable in plugins.
    $ = function (selector, context) {
        return zepto.init(selector, context)
    }

    /**
     * 将 source 的属性混入 target 中，若 deep 为真，则为深度混入（遍历）
     * @param target
     * @param source
     * @param deep
     */
    function extend (target, source, deep) {
        for (key in source)
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key]))
                    target[key] = {}
                if (isArray(source[key]) && !isArray(target[key]))
                    target[key] = []
                extend(target[key], source[key], deep)
            }
            else if (source[key] !== undefined) target[key] = source[key]
    }

    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    $.extend = function (target) {
        var deep, args = slice.call(arguments, 1)
        if (typeof target == 'boolean') {
            deep = target
            target = args.shift()
        }
        args.forEach(function (arg) {
            extend(target, arg, deep)
        })
        return target
    }

    // `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
    // This method can be overriden in plugins.
    zepto.qsa = function (element, selector) {
        var found,
            maybeID = selector[0] == '#',
            maybeClass = !maybeID && selector[0] == '.',
            nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still
                                                                             // gets checked
            isSimple = simpleSelectorRE.test(nameOnly)
        return (isDocument(element) && isSimple && maybeID) ?
            ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
            (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
                slice.call(
                    isSimple && !maybeID ?
                        maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
                            element.getElementsByTagName(selector) : // Or a tag
                        element.querySelectorAll(selector) // Or it's not simple, and we need to query all
                )
    }

    function filtered (nodes, selector) {
        return selector == null ? $(nodes) : $(nodes).filter(selector)
    }

    $.contains = document.documentElement.contains ?
        function (parent, node) {
            return parent !== node && parent.contains(node)
        } :
        function (parent, node) {
            while (node && (node = node.parentNode))
                if (node === parent) return true
            return false
        }

    function funcArg (context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    function setAttribute (node, name, value) {
        value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    // access className property while respecting SVGAnimatedString
    function className (node, value) {
        var klass = node.className || '',
            svg = klass && klass.baseVal !== undefined

        if (value === undefined) return svg ? klass.baseVal : klass
        svg ? (klass.baseVal = value) : (node.className = value)
    }

    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // "08"    => "08"
    // JSON    => parse if valid
    // String  => self
    /**
     * 将特殊字符转化为字符串
     * @param value
     * @returns {*}
     */
    function deserializeValue (value) {
        var num
        try {
            return value ?
            value == "true" ||
            ( value == "false" ? false :
                value == "null" ? null :
                    !/^0/.test(value) && !isNaN(num = Number(value)) ? num :
                        /^[\[\{]/.test(value) ? $.parseJSON(value) :
                            value )
                : value
        } catch (e) {
            return value
        }
    }

    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject

    /**
     * 判断一个对象是否为空对象
     * @param obj
     * @returns {boolean}
     */
    $.isEmptyObject = function (obj) {
        var name
        for (name in obj) return false
        return true
    }

    /**
     * 判断元素是否在数组中
     * @param elem
     * @param array
     * @param i
     * @returns {number}
     */
    $.inArray = function (elem, array, i) {
        return emptyArray.indexOf.call(array, elem, i)
    }

    $.camelCase = camelize

    // 去除字符串首尾的空格
    $.trim = function (str) {
        return str == null ? "" : String.prototype.trim.call(str)
    }

    // plugin compatibility
    $.uuid = 0
    $.support = {}
    $.expr = {}

    // 遍历 elements，对其中每一个元素进行操作，最后返回处理后的元素集
    $.map = function (elements, callback) {
        var value, values = [], i, key
        // elements 为类数组
        if (likeArray(elements))
            for (i = 0; i < elements.length; i++) {
                value = callback(elements[i], i)
                if (value != null) values.push(value)
            }
        // elements 为对象
        else
            for (key in elements) {
                value = callback(elements[key], key)
                // 处理结果为空则过滤掉
                if (value != null) values.push(value)
            }
        // 返回结果数组
        return flatten(values)
    }


    // 遍历 elements, 对其中每一个元素进行操作，最后返回原 elements
    $.each = function (elements, callback) {
        var i, key
        if (likeArray(elements)) {
            for (i = 0; i < elements.length; i++)
                if (callback.call(elements[i], i, elements[i]) === false) return elements
        } else {
            for (key in elements)
                if (callback.call(elements[key], key, elements[key]) === false) return elements
        }

        return elements
    }

    // 对 Array.filter 进行封装
    $.grep = function (elements, callback) {
        return filter.call(elements, callback)
    }

    // 将 window 下的方法挂载到 Zepto, 这里的目的是为了统一接口风格
    if (window.JSON) $.parseJSON = JSON.parse

    // Populate the class2type map
    //class2type 存储了表示各种数据类型的值, 如 class2type['[Object Number]'] === 'number'
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })

    // Define methods that will be available on all
    // Zepto collections
    // $.fn 下挂载了所有 Zepto 对象共享的方法
    $.fn = {
        // Because a collection acts like an array
        // copy over these useful array functions.
        // Zepto 元素集实际上是类数组， 所以给他们挂载数组具有的方法
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        sort: emptyArray.sort,
        indexOf: emptyArray.indexOf,
        concat: emptyArray.concat,

        // `map` and `slice` in the jQuery API work differently
        // from their array counterparts
        map: function (fn) {
            return $($.map(this, function (el, i) {
                return fn.call(el, i, el)
            }))
        },
        slice: function () {
            return $(slice.apply(this, arguments))
        },

        ready: function (callback) {
            // need to check if document.body exists for IE as that browser reports
            // document ready when it hasn't yet created the body element
            // 在 IE 中， body 元素没有创建时 document 的 ready 事件也已经触发
            // 所以要判断 document.readyState 的同时，要判断 body 元素是否已经创建
            if (readyRE.test(document.readyState) && document.body) callback($)

            // 监听 document 的 DOMContentLoaded 事件发生后， 才执行回调
            else document.addEventListener('DOMContentLoaded', function () {
                callback($)
            }, false)
            return this
        },

        // 未传递参数给 $(elements).get() 时， 将 elements 转化为数组后返回
        // 若有传递参数，则返回 elements 中 idx 索引对应的值
        // 若 idx 为负数，则从后开始索引
        get: function (idx) {
            return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
        },

        // 简单粗暴，将元素集合转化为数组
        toArray: function () {
            return this.get()
        },

        // 返回元素集的长度
        size: function () {
            return this.length
        },

        // $(element).remove() 将 element 从 DOM 中删除
        remove: function () {
            return this.each(function () {
                if (this.parentNode != null)
                    this.parentNode.removeChild(this)
            })
        },

        // $(elements).each(function (el, idx){})
        // 遍历处理 elements 中的元素后，返回结果数组
        each: function (callback) {
            emptyArray.every.call(this, function (el, idx) {
                return callback.call(el, idx, el) !== false
            })
            return this
        },

        // $(elements).filter(selector) 使用 selector 对 elements 进行过滤，返回匹配 selector 的元素列表
        filter: function (selector) {
            if (isFunction(selector)) return this.not(this.not(selector))
            return $(filter.call(this, function (element) {
                return zepto.matches(element, selector)
            }))
        },

        // $(elements).add(otherElements, context)
        // 将 context 上下文中的 otherElements 添加到 elements 中后返回
        add: function (selector, context) {
            return $(uniq(this.concat($(selector, context))))
        },

        // $(elements).is(selector)
        // 判断 elements 是否匹配 selector
        is: function (selector) {
            return this.length > 0 && zepto.matches(this[0], selector)
        },

        // $(elements).not(selector)
        // 将 elements 中匹配 selector 的元素剔除
        not: function (selector) {
            var nodes = []
            if (isFunction(selector) && selector.call !== undefined)
                this.each(function (idx) {
                    if (!selector.call(this, idx)) nodes.push(this)
                })
            else {
                var excludes = typeof selector == 'string' ? this.filter(selector) :
                    (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
                this.forEach(function (el) {
                    if (excludes.indexOf(el) < 0) nodes.push(el)
                })
            }
            return $(nodes)
        },

        // $(element).has(selector) 判断 element 上下文中是否含有匹配 selector 的后代元素
        has: function (selector) {
            return this.filter(function () {
                return isObject(selector) ?
                    $.contains(this, selector) :
                    $(this).find(selector).size()
            })
        },

        // $(elements).e(idx)
        // 返回 elements 中 第 idx 个元素
        // 若 idx 为 -1 则返回最后一个元素
        //  注意是返回包含这个元素的数组!
        eq: function (idx) {
            return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
        },

        // $(elements).first()
        // 返回 elements 中第一个元素
        first: function () {
            var el = this[0]
            // 若 el 不存在，且 el 不是一个对象，则直接返回 el
            // 否则，将 el 封装为i Zepto 对象后返回
            return el && !isObject(el) ? el : $(el)
        },

        // 返回 elements 中最后一个元素）
        last: function () {
            var el = this[this.length - 1]
            return el && !isObject(el) ? el : $(el)
        },

        // $(elements).find(selector)
        // 在 elements 上下文中寻找匹配 selector 的后代元素，以数组形式返回
        find: function (selector) {
            var result, $this = this
            if (!selector) result = []
            else if (typeof selector == 'object')
                result = $(selector).filter(function () {
                    var node = this
                    return emptyArray.some.call($this, function (parent) {
                        return $.contains(parent, node)
                    })
                })
            else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
            else result = this.map(function () {
                    return zepto.qsa(this, selector)
                })
            return result
        },

        // $(elements).closest(selector, context)
        // 若 selector 是一个选择器，则在 context 上下文范围内寻找匹配 selector 的最近的元素
        // 若 selector 是一个 collection 或 element 类型， 则返回匹配给定的元素
        // 注意返回一个元素，而非一组
        closest: function (selector, context) {
            var node = this[0], collection = false
            if (typeof selector == 'object') collection = $(selector)
            while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
                node = node !== context && !isDocument(node) && node.parentNode
            return $(node)
        },

        // 以上的 closest 是从当前元素出发，寻找第一个匹配 selector 的元素
        // 这里的 $(elements).parents(selector) 则返回匹配 selector 的所有祖先元素的集合
        parents: function (selector) {
            var ancestors = [], nodes = this
            while (nodes.length > 0)
                //
                nodes = $.map(nodes, function (node) {
                    if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
                        ancestors.push(node)
                        return node
                    }
                })
            return filtered(ancestors, selector)
        },

        // 返回匹配 selector 的直接父元素
        parent: function (selector) {
            // [a, b, c].pluck('parentNode') => [a.parentNode, b.parentNode, c.parentNode]
            return filtered(uniq(this.pluck('parentNode')), selector)
        },

        // 返回匹配 selector 的直接子元素
        children: function (selector) {
            return filtered(this.map(function () {
                return children(this)
            }), selector)
        },

        // $(elements).contents()
        // 返回 elements 的子节点
        // 注意不是子元素！子节点 childNodes 是原生的 JS 属性，包含元素、属性和注释
        contents: function () {
            return this.map(function () {
                return slice.call(this.childNodes)
            })
        },

        // $(elements).siblings(selector)
        // 返回同级的兄弟元素
        siblings: function (selector) {
            return filtered(this.map(function (i, el) {
                // 找到父亲
                return filter.call(children(el.parentNode), function (child) {
                    // 判断父亲的儿子不是自己，则是自己的兄弟啦哈哈哈哈
                    return child !== el
                })
            }), selector)
        },

        // $(elements).empty()
        // 判断 elements 是否为空元素， 即 innerHTML 值为空
        empty: function () {
            return this.each(function () {
                this.innerHTML = ''
            })
        },

        // `pluck` is borrowed from Prototype.js
        // $(elements).pluck(property）
        // 返回 elements 中每一个元素的 property 属性对应的值组成的数组
        pluck: function (property) {
            return $.map(this, function (el) {
                return el[property]
            })
        },

        // $(elements).show()
        // 显示 elements 元素，即取消 elements 的 display: none 属性
        show: function () {
            return this.each(function () {
                this.style.display == "none" && (this.style.display = '')
                if (getComputedStyle(this, '').getPropertyValue("display") == "none")
                    // defaultDisplay(nodeName) 将 nodeName 对应的元素的 display 属性设置为 block
                    this.style.display = defaultDisplay(this.nodeName)
            })
        },

        // $(elements).replaceWith(newContent)
        // 用 newContent 替代 dlements
        replaceWith: function (newContent) {
            // 在旧元素前插入后，删除旧元素
            return this.before(newContent).remove()
        },

        // $(elements).wrap(structure)
        // 使用 structure 将 elements 中的每一个元素包裹起来
        wrap: function (structure) {
            var func = isFunction(structure)
            if (this[0] && !func)
                var dom = $(structure).get(0),
                    // 先找到父元素
                    clone = dom.parentNode || this.length > 1

            return this.each(function (index) {
                $(this).wrapAll(
                    func ? structure.call(this, index) :
                        clone ? dom.cloneNode(true) : dom
                )
            })
        },

        // $(element).wrap(structure)
        // 使用 structure 将 element 元素包裹起来
        wrapAll: function (structure) {
            if (this[0]) {
                // 先把 structure 插入到旁边
                $(this[0]).before(structure = $(structure))
                var children
                // drill down to the inmost element
                // 然后找到最深的后代元素
                while ((children = structure.children()).length) structure = children.first()
                // 将当前元素 append 到 structure 最深的后代元素中
                $(structure).append(this)
            }
            return this
        },

        // 在内部包裹
        wrapInner: function (structure) {
            var func = isFunction(structure)
            return this.each(function (index) {
                var self = $(this), contents = self.contents(),
                    dom = func ? structure.call(this, index) : structure
                contents.length ? contents.wrapAll(dom) : self.append(dom)
            })
        },

        // 去掉最外层的包裹元素
        unwrap: function () {
            this.parent().each(function () {
                $(this).replaceWith($(this).children())
            })
            return this
        },

        // $(elements).clone()
        // 克隆元素
        clone: function () {
            return this.map(function () {
                // cloneNode(true) 是原生 JS 的方法，true 表示深度克隆
                // 深度克隆即将后代元素也克隆进来，而不只是引用
                return this.cloneNode(true)
            })
        },

        // 隐藏元素最简单了，将 display 设置为 none 即可
        // 反之则不然，详见 show() 方法
        hide: function () {
            return this.css("display", "none")
        },

        // 隐藏或显示元素
        toggle: function (setting) {
            return this.each(function () {
                var el = $(this)
                    ;
                // 若未传入 setting，此时如果元素处于隐藏状态，则将其显示
                // 若有传入 setting, 则不管元素是否处于隐藏状态，都将其显示, 即调用 show() 方法
                (setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
            })
        },

        // 找到上一个相邻的兄弟元素
        prev: function (selector) {
            return $(this.pluck('previousElementSibling')).filter(selector || '*')
        },
        // 找到下一个相邻的兄弟元素
        next: function (selector) {
            return $(this.pluck('nextElementSibling')).filter(selector || '*')
        },

        //### 2014.12.3
        html: function (html) {
            return 0 in arguments ?
                this.each(function (idx) {
                    var originHtml = this.innerHTML
                    $(this).empty().append(funcArg(this, html, idx, originHtml))
                }) :
                (0 in this ? this[0].innerHTML : null)
        },
        text: function (text) {
            return 0 in arguments ?
                this.each(function (idx) {
                    var newText = funcArg(this, text, idx, this.textContent)
                    this.textContent = newText == null ? '' : '' + newText
                }) :
                (0 in this ? this[0].textContent : null)
        },
        attr: function (name, value) {
            var result
            return (typeof name == 'string' && !(1 in arguments)) ?
                (!this.length || this[0].nodeType !== 1 ? undefined :
                    (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
                ) :
                this.each(function (idx) {
                    if (this.nodeType !== 1) return
                    if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
                    else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
                })
        },
        removeAttr: function (name) {
            return this.each(function () {
                // nodeType === 1 表示是元素节点
                 this.nodeType === 1 && setAttribute(this, name)
            })
        },
        prop: function (name, value) {
            name = propMap[name] || name
            return (1 in arguments) ?
                this.each(function (idx) {
                    this[name] = funcArg(this, value, idx, this[name])
                }) :
                (this[0] && this[0][name])
        },
        data: function (name, value) {
            var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

            var data = (1 in arguments) ?
                this.attr(attrName, value) :
                this.attr(attrName)

            return data !== null ? deserializeValue(data) : undefined
        },
        val: function (value) {
            return 0 in arguments ?
                this.each(function (idx) {
                    this.value = funcArg(this, value, idx, this.value)
                }) :
                (this[0] && (this[0].multiple ?
                    $(this[0]).find('option').filter(function () {
                        return this.selected
                    }).pluck('value') :
                    this[0].value)
                )
        },
        offset: function (coordinates) {
            if (coordinates) return this.each(function (index) {
                var $this = $(this),
                    coords = funcArg(this, coordinates, index, $this.offset()),
                    parentOffset = $this.offsetParent().offset(),
                    props = {
                        top: coords.top - parentOffset.top,
                        left: coords.left - parentOffset.left
                    }

                if ($this.css('position') == 'static') props['position'] = 'relative'
                $this.css(props)
            })
            if (!this.length) return null
            var obj = this[0].getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            }
        },
        css: function (property, value) {
            if (arguments.length < 2) {
                var element = this[0], computedStyle = getComputedStyle(element, '')
                if (!element) return
                if (typeof property == 'string')
                    return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
                else if (isArray(property)) {
                    var props = {}
                    $.each(property, function (_, prop) {
                        props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
                    })
                    return props
                }
            }

            var css = ''
            if (type(property) == 'string') {
                if (!value && value !== 0)
                    this.each(function () {
                        this.style.removeProperty(dasherize(property))
                    })
                else
                    css = dasherize(property) + ":" + maybeAddPx(property, value)
            } else {
                for (key in property)
                    if (!property[key] && property[key] !== 0)
                        this.each(function () {
                            this.style.removeProperty(dasherize(key))
                        })
                    else
                        css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
            }

            return this.each(function () {
                this.style.cssText += ';' + css
            })
        },
        index: function (element) {
            return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
        },
        hasClass: function (name) {
            if (!name) return false
            return emptyArray.some.call(this, function (el) {
                return this.test(className(el))
            }, classRE(name))
        },
        addClass: function (name) {
            if (!name) return this
            return this.each(function (idx) {
                if (!('className' in this)) return
                classList = []
                var cls = className(this), newName = funcArg(this, name, idx, cls)
                newName.split(/\s+/g).forEach(function (klass) {
                    if (!$(this).hasClass(klass)) classList.push(klass)
                }, this)
                classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
            })
        },
        removeClass: function (name) {
            return this.each(function (idx) {
                if (!('className' in this)) return
                if (name === undefined) return className(this, '')
                classList = className(this)
                funcArg(this, name, idx, classList).split(/\s+/g).forEach(function (klass) {
                    classList = classList.replace(classRE(klass), " ")
                })
                className(this, classList.trim())
            })
        },
        toggleClass: function (name, when) {
            if (!name) return this
            return this.each(function (idx) {
                var $this = $(this), names = funcArg(this, name, idx, className(this))
                names.split(/\s+/g).forEach(function (klass) {
                    (when === undefined ? !$this.hasClass(klass) : when) ?
                        $this.addClass(klass) : $this.removeClass(klass)
                })
            })
        },
        scrollTop: function (value) {
            if (!this.length) return
            var hasScrollTop = 'scrollTop' in this[0]
            if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
            return this.each(hasScrollTop ?
                function () {
                    this.scrollTop = value
                } :
                function () {
                    this.scrollTo(this.scrollX, value)
                })
        },
        scrollLeft: function (value) {
            if (!this.length) return
            var hasScrollLeft = 'scrollLeft' in this[0]
            if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
            return this.each(hasScrollLeft ?
                function () {
                    this.scrollLeft = value
                } :
                function () {
                    this.scrollTo(value, this.scrollY)
                })
        },
        position: function () {
            if (!this.length) return

            var elem = this[0],
            // Get *real* offsetParent
                offsetParent = this.offsetParent(),
            // Get correct offsets
                offset = this.offset(),
                parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {top: 0, left: 0} : offsetParent.offset()

            // Subtract element margins
            // note: when an element has margin: auto the offsetLeft and marginLeft
            // are the same in Safari causing offset.left to incorrectly be 0
            offset.top -= parseFloat($(elem).css('margin-top')) || 0
            offset.left -= parseFloat($(elem).css('margin-left')) || 0

            // Add offsetParent borders
            parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
            parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

            // Subtract the two offsets
            return {
                top: offset.top - parentOffset.top,
                left: offset.left - parentOffset.left
            }
        },
        offsetParent: function () {
            return this.map(function () {
                var parent = this.offsetParent || document.body
                while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
                    parent = parent.offsetParent
                return parent
            })
        }
    }

    // for now
    $.fn.detach = $.fn.remove

        // Generate the `width` and `height` functions
    ;
    ['width', 'height'].forEach(function (dimension) {
        var dimensionProperty =
            dimension.replace(/./, function (m) {
                return m[0].toUpperCase()
            })

        $.fn[dimension] = function (value) {
            var offset, el = this[0]
            if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
                isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
                (offset = this.offset()) && offset[dimension]
            else return this.each(function (idx) {
                el = $(this)
                el.css(dimension, funcArg(this, value, idx, el[dimension]()))
            })
        }
    })

    function traverseNode (node, fun) {
        fun(node)
        for (var i = 0, len = node.childNodes.length; i < len; i++)
            traverseNode(node.childNodes[i], fun)
    }

    // Generate the `after`, `prepend`, `before`, `append`,
    // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    adjacencyOperators.forEach(function (operator, operatorIndex) {
        var inside = operatorIndex % 2 //=> prepend, append

        $.fn[operator] = function () {
            // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
            var argType, nodes = $.map(arguments, function (arg) {
                    argType = type(arg)
                    return argType == "object" || argType == "array" || arg == null ?
                        arg : zepto.fragment(arg)
                }),
                parent, copyByClone = this.length > 1
            if (nodes.length < 1) return this

            return this.each(function (_, target) {
                parent = inside ? target : target.parentNode

                // convert all methods to a "before" operation
                target = operatorIndex == 0 ? target.nextSibling :
                    operatorIndex == 1 ? target.firstChild :
                        operatorIndex == 2 ? target :
                            null

                var parentInDocument = $.contains(document.documentElement, parent)

                nodes.forEach(function (node) {
                    if (copyByClone) node = node.cloneNode(true)
                    else if (!parent) return $(node).remove()

                    parent.insertBefore(node, target)
                    if (parentInDocument) traverseNode(node, function (el) {
                        if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                            (!el.type || el.type === 'text/javascript') && !el.src)
                            window['eval'].call(window, el.innerHTML)
                    })
                })
            })
        }

        // after    => insertAfter
        // prepend  => prependTo
        // before   => insertBefore
        // append   => appendTo
        $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function (html) {
            $(html)[operator](this)
            return this
        }
    })

    zepto.Z.prototype = $.fn

    // Export internal API functions in the `$.zepto` namespace
    zepto.uniq = uniq
    zepto.deserializeValue = deserializeValue
    $.zepto = zepto

    return $
})();

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)
