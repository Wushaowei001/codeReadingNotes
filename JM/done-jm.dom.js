//dom
J.$package(function(J){
    var doc = document,

    // J.type 用于判断一个 obj 的类型
    $T = J.type,

    // 标签名
    tagNameExpr = /^[\w-]+$/,
    
    // id 名以 # 开头
    idExpr = /^#([\w-]*)$/,
    
    // class 名以 . 开头
    classExpr = /^\.([\w-]+)$/,
    
    selectorEngine;

    // 判断是否支持 HTML5 的 classList 接口
    var hasClassListProperty = 'classList' in document.documentElement;

    // 浏览器前缀
    var vendors = ['o', 'ms' ,'moz' ,'webkit'];

    // 缓存一个空的 div
    var div = document.createElement('div');

    var $D={

        // J.dom.$(selector, context)
        $:function(selector,context){
            var result;
            var qsa;

            // 若未指定上下文, 则将 document 作为默认上下文
            context = context || doc;
            
            //优先使用原始的
            if(idExpr.test(selector)) {
                result = this.id(selector.replace("#",""));
                if(result)  return [result] ;
                else return [] ;
            }
            else if(tagNameExpr.test(selector)){                
                result = this.tagName(selector,context);
            }
            else if(classExpr.test(selector)){                
                result = this.className(selector.replace(".",""),context);
            }
            // //自定义选择器
            // else if(selectorEngine) result = selectorEngine(selector,context);
            //querySelectorAll
            else result = context.querySelectorAll(selector);
        

            //nodeList转为array
            // J.toArray() 定义在 jm.base.js 中
            return J.toArray(result);
                
        },

        // J.dom.id(id)
        // 使用原生的 id 选择器
        id:function(id){
            return doc.getElementById(id);
        },

        // J.dom.tagName(tagName, context)
        // 使用原生的 tag 选择器
        tagName:function(tagName,context){
            context=context||doc;
            return context.getElementsByTagName(tagName);
        },

        // J.dom.node(name)
        // 创建一个元素
        node:function(name){
            return doc.createElement(name);
        },

        // J.dom.className(className, context)
        // 使用原生的 class 选择器
        className:function(className,context){
            var children, elements, i, l, classNames;
            context=context||doc;
            if(context.getElementsByClassName){
                return context.getElementsByClassName(className);
            }
            else{
                children = context.getElementsByTagName('*');
                elements = [];
                for(i = 0, l = children.length; i < l; ++i){
                    if(classNames = children[i].className
                        && J.indexOf(classNames.split(' '), className) >= 0){
                        elements.push(children[i]);
                    }
                }
                return elements;
            }
        },

        // J.dom.remove(node)
        // 删除元素节点
        remove:function(node){
            // 找到父元素, 删除子元素
            var context = node.parentNode;
            if(context) context.removeChild(node);
        },

        // J.dom.setSelectorEngine(func)
        // 设置选择器引擎, 若未调用则使用默认
        setSelectorEngine:function(func){
            selectorEngine=func;
        },

        // J.dom.matchsSelector(ele, selector)
        // 判断 ele 元素 是否匹配 selector 选择器
        matchesSelector:function(ele,selector){
            if(!ele || !selector) return;
            // 封装带各种私有浏览器前缀的方法
            var matchesSelector = ele.webkitMatchesSelector || ele.mozMatchesSelector || ele.oMatchesSelector || ele.matchesSelector;
            // 浏览器支持则直接调用浏览器方法
            if(matchesSelector) return matchesSelector.call(ele,selector);
            
            // 否则, 判断 ele 是否在 selector 匹配的元素列表中
            var list = this.$(selector);

            // J.index() 定义在 jm.base.js 中
            if(J.indexOf(list,ele) > 0) return true;
            return false;
        },

        // 寻找最近的元素
        closest:function(elem,selector){
            while(elem){
                if($D.matchesSelector(elem,selector)){
                    // 遍历, 直到自身匹配则返回自身
                    return elem;
                }
                elem = elem.parentNode;
            }
        },
        // 对比: zepto.js 中的实现
        // closest: function (selector, context) {
        //     var node = this[0], collection = false
        //     if (typeof selector == 'object') collection = $(selector)
        //     while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
        //         node = node !== context && !isDocument(node) && node.parentNode
        //     return $(node)
        // },

        // J.dom.toDomStyle(cssStyle)
        // 将形如 'background-color: black;' 装化为 => 'backgroundColor: black;'
        toDomStyle:function(cssStyle){
            if(!$T.isString(cssStyle)) return;
                return cssStyle.replace(/\-[a-z]/g,function(m) { return m.charAt(1).toUpperCase(); });
        },

        // 和 toDomStyle 方法相反
        toCssStyle:function(domStyle){
            if(!$T.isString(domStyle)) return;
                  return domStyle.replace(/[A-Z]/g, function(m) { return '-'+m.toLowerCase(); });
        },

        // J.dom.setStyle(elem, styleName, styleValue)
        // 设置元素样式
        setStyle:function(elem ,styleName,styleValue){
            var self = this;
            if(elem.length){
                // 对一组元素进行赋值
                J.each(elem ,function(e){
                    self.setStyle(e,styleName,styleValue);
                });
                return;
            }

            if($T.isObject(styleName)){
                // 传入的 styleName 是一个对象, 进行对象遍历后赋值
                for(var n in styleName){
                    if(styleName.hasOwnProperty(n)){
                        elem.style[n] = styleName[n];
                    }
                }
                return;
            }
            if($T.isString(styleName)){
                // 传入的 styleName 是字符串, 直接进行赋值
                elem.style[styleName] = styleValue;
            }
        },
        
        /**
         * 
         * 获取元素的当前实际样式，css 属性需要用驼峰式写法，如：fontFamily
         * 
         * @method getStyle
         * @memberOf dom
         * 
         * @param {Element} el 元素
         * @param {String} styleName css 属性名称
         * @return {String} 返回元素样式
         */
        getStyle: function(el, styleName){
            if(!el){
                return;
            }
            if(styleName === "float"){
                // 处理特殊属性 'float' 对应为 'cssFloat'
                styleName = "cssFloat";
            }
            if(el.style[styleName]){
                // 找到手动设置的属性后直接返回
                return el.style[styleName];
            }else if(window.getComputedStyle){
                // 若无手动设置, 则计算浏览器渲染后的属性后返回
                return window.getComputedStyle(el, null)[styleName];

                // document.defaultView 返回当前 document 对应的 window 
            }else if(document.defaultView && document.defaultView.getComputedStyle){
                // 将形如 'backgroundColor: red' 替换为 'background-color: red'
                styleName = styleName.replace(/([/A-Z])/g, "-$1");
                styleName = styleName.toLowerCase();
                var style = document.defaultView.getComputedStyle(el, "");
                return style && style.getPropertyValue(styleName);
            }else if(el.currentStyle){
                return el.currentStyle[styleName];
            }

        },
        //获取带有出产商的属性名
        getVendorPropertyName : function(prop) {
            // var div = document.createElement('div'); 一个空的 div
            var style = div.style;
            var _prop;
            // 若属性名存在则直接返回
            if (prop in style) return prop;
            // _prop = prop;
            // 将 prop 的首字母大写
            _prop = prop.charAt(0).toUpperCase() + prop.substr(1);
            // var vendors = ['o', 'ms' ,'moz' ,'webkit']; 存储了多个浏览器的私有前缀
            // 若属性名不存在, 添加私有前缀后再查看是否存在
            for(var i = vendors.length; i--;){
                var v = vendors[i];
                var vendorProp = v + _prop;
                if (vendorProp in style) {
                    return vendorProp;
                }
            }
        },

         //检测是否支持3D属性
         isSupprot3d : function(){
             // var transformStr = $D.getVendorPropertyName("transform");
             // $D.setStyle(div ,transformStr ,"rotatex(90deg)");
             // if(div.style[transformStr] == "") return false;
             // return true;
             var p_prop = $D.getVendorPropertyName("perspective");
             return p_prop && p_prop in div.style;
         },

         // 返回 arry 中匹配 selector 的元素
        filterSelector:function(arr,selector){
            // J.filter(arr, callback) 定义在 jm.base.js
            return J.filter(arr,function(elem){
                return $D.matchesSelector(elem,selector);
            });
        },

        addClass: (function(){
            if(hasClassListProperty){
                // classList 需要 IE10 才支持 http://caniuse.com/#search=classList
                return function (elem, className) {
                    if (!elem || !className || $D.hasClass(elem, className)){
                        return;
                    }
                    elem.classList.add(className);
                };
            }
            else{
                return function(elem, className){
                    if (!elem || !className || $D.hasClass(elem, className)) {
                        return;
                    }
                    // 不支持则使用字符串拼接的方式直接在 className 后面拼接
                    elem.className += " "+ className;
                }    
            }
        })(),


        hasClass: (function(){
            if (hasClassListProperty) {
                return function (elem, className) {
                    if (!elem || !className) {
                        return false;
                    }
                    return elem.classList.contains(className);
                };
            } else {
                return function (elem, className) {
                    if (!elem || !className) {
                        return false;
                    }
                    // 酷! 这个判断方法很巧妙
                    return -1 < (' ' + elem.className + ' ').indexOf(' ' + className + ' ');
                };
            }
        })(),

        removeClass: (function(){
            if (hasClassListProperty) {
                return function (elem, className) {
                    // 容错处理: 操作无效则直接返回
                    if (!elem || !className || !$D.hasClass(elem, className)) {
                        return;
                    }
                    elem.classList.remove(className);
                };
            } else {
                return function (elem, className) {
                    if (!elem || !className || !$D.hasClass(elem, className)) {
                        return;
                    }
                    // (?:exp) 匹配 exp 但不捕获匹配的文本, 也不给此分组编号
                    elem.className = elem.className.replace(new RegExp('(?:^|\\s)' + className + '(?:\\s|$)'), ' ');
                };
            }
        })(),

        toggleClass:function(ele,className){
            if($D.hasClass(ele,className)){
                $D.removeClass(ele,className);
            }
            else{
                $D.addClass(ele,className);
            }
        },
        // 类似源生方法 `insertBefore`
        // 找到下一个兄弟
        // 在下一个兄弟前插入
        insertAfter: function(parentElement, newElement, refernceElement){
            var next = refernceElement.nextSibling;
            if(next){
                parentElement.insertBefore(newElement, next);
            }
            else{
                parentElement.appendChild(newElement);
            }
            return newElement;
        }
    };

    // 导出
    J.dom=$D;
});
