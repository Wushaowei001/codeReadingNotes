# 阅读笔记

## 阅读进度

2014.12.2 读 zepto.js

判断是否为数组
    
    var isArray = Array.isArray || function(object){ return object instanceof Array }

判断元素是否匹配选择器
    
    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
                          element.oMatchesSelector || element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    

判断元素类型
        
    function type(obj) {
        var class2type = {}  
        $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
            class2type[ "[object " + name + "]" ] = name.toLowerCase()
        })
        // 如果 obj 为 null 是没有 toString() 方法的， 所以使用 String(null) 得到 'null'
        return obj == null ? String(obj) :
          class2type[toString.call(obj)] || "object"
    }
      
    function isFunction(value) { return type(value) == "function" }
    // 如果 obj === window 的话， 利用 window == window.window 这个特点就可以判断
    function isWindow(obj)     { return obj != null && obj == obj.window }
    // 利用 document.nodeType === document.DOCUMENT_NODE
    function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
    function isObject(obj)     { return type(obj) == "object" }
    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }
    // 类数组的特点，obj.length 为数字
    function likeArray(obj) { return typeof obj.length == 'number' }  
