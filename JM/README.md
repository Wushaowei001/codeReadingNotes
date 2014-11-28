# 文档阅读笔记 - [JM 文档](http://alloyteam.github.io/Spirit/modules/JM/index.html)


## 简单示例

	var $E = JM.event; // 事件模块
	var $D = JM.dom;   // DOM 操作模块
	var $A = JM.animation; // 动画模块

	// 简单示例
	J.animation({
		selector: '#id',
		duration: 1000,
		use3d: true    // 使用GPU的3D动画加速
	}).setStyle({      // 设置样式
		'top': '100px',
		'opacity': '1'
	}).transit(function (){  //  使用css3的transiton形式来修改样式
		this.setDuration(500);
		this.scale(2).setStyle({
			'top': '200px',
			'opacity': '0'
		});
	});


	// 选择器
	JM.dom.$(selectorText) 
	JM.dom.$(id) // 建议使用 id 因为更快

	// 事件监听, http://laispace.github.io/Spirit/modules/JM/index.html#event
	JM.event.on(obj, evtType, handler)

- animation 动画模块

	底层 CSS3 实现, 依赖 dom, event, type 模块

	J.animation({
		selector: '-id1', // 选择器
		durtation: 1000,  // 动画执行的时间
		use3d: true,      // 是否启动硬件加速
		runType: 'ease-in', // 动画类型, 可为 ease-in, ease-in-out
		delay: 500		  // 动画延迟的时间	 
	})

	动画函数:

	scale:function(scale){}
	scaleX:function(scaleX){}
	scaleY:function(scaleY){}
	rotate:function(rotate){}
	rotateX:function(rotateX){}
	rotateY:function(rotateY){}
	rotateZ:function(rotateZ){}
	translate:function(translateX,translateY,translateZ){}
	translateX:function(translateX){}
	translateY:function(translateY){}
	skew:function(x,y){}
	skewX:function(x){}
	skewY:function(y){}
	setStyle:function(styleName,styleValue){}
	toOrigin:function(){} 动画参数清空
	transit:function(onFinished){} 启动动画 onFinished为动画回调函数

- audio 音频模块
	
	依赖 dom, event, browser 模块

- base 核心模块

	为所有模块所共用。

	基础函数:

	$namespace: function(name) {}为$package函数内部使用
	$package:function(ns,func) {}命名空间
	extend:function(destination,source) {} 继承
	bind:function(func, context, var_args) {}
	Class:function(){} 定义类函数
	toArray: function(pseudoArrayObj){}
	indexOf:function(arr,elem){}
	every:function(arr,callback){}
	some:function(arr,callback){}
	each:function(arr,callback){}
	map:function(arr,callback){}
	filter:function(arr,callback){} 过滤List
	isEmptyObject:function(obj){}
	random : function(min, max){}

- browser 浏览器检测模块
	
	J.browser.ie
	J.browser.chrome
	J.browser.plugins.flash
	J.adobeAir

- cookie

	J.cookie.set(name, value, domain, path, hour)
	J.cookie.get(name)
	J.cookie.remove(name, domain, path)

- dom DOM 处理模块

	J.dom.id('my-id') // 建议使用 id 进行查找最快
	J.dom.className('my-class') 
	J.dom.tagName('button')
	J.dom.addClass('-my-id', 'my-class')
	dom 函数:

	$:function(selector,context){} 会优先选用原生的
	id:function(id){}
	tagName:function(tagName,context){}
	className:function(className,context){}
	remove:function(node){}
	setSelectorEngine:function(func){}
	toDomStyle:function(cssStyle){}
	toCssStyle:function(domStyle){}
	setStyle:function(elem ,styleName,styleValue){}
	getStyle: function(el, styleName){}
	getVendorPropertyName : function(prop) {}
	isSupprot3d : function(){}
	filterSelector:function(arr,selector){}
	addClass function(elem,className){}
	removeClass function(elem,className){}
	hasClass function(elem,className){}
	toggleClass:function(ele,className){}
	insertAfter: function(parentElement, newElement, refernceElement){} 类似源生方法 insertBefore

- event 事件模块

	JM.event.on(obj, evtType, handler) 事件监听

	event 事件列表:

	isDomEvent function(obj,evtType){} 如果是DOM事件，返回正确的事件名；否则返回布尔值 false
	bindDomEvent function(obj, evtType, handler){} 封装绑定DOM事件的方法,以兼容低版本IE
	unbindDomEvent function(obj, evtType, handler){} 解除绑定DOM事件的方法
	on:function(obj, evtType, handler){}
	once:function(obj,evtType,handler){}
	off:function(obj,evtType,handler){}
	fire:function(obj,evtType){}
	getActionTarget : function(event, level, property, parent){} 获取点击的事件源
	bindCommands : function(targetElement, eventName, commends, commendName){}
	getTouchPos = function(e){} 辅助函数
	getDist = function(p1 , p2){} 计算两点之间距离
	getAngle = function(p1 , p2){} 计算两点之间所成角度

	event 自定义事件

	_fire
	_off
	tap 按下松开之间的移动距离小于20，认为发生了tap
	hold 按下松开之间的移动距离小于20，认为点击生效swipe按下之后移动30px之后就认为swipe开始,swipe最大经历时间500
	transform
	scrollstart
	scrollend
	scrolltobottom
	ortchange 兼容性更好的orientationchange事件，这里使用resize实现。不覆盖原生orientation change 和 resize事件

- http ajax 模块
	
	J.http.ajax({
	    url: 'http:www.xxx.com/getSomething'
	    method : 'post',
	    timeout : 50000,
	    withCredentials : true, //是否跨域
	    async : true, //是否异步
	    onError : function(data){
	        alert(' ajax error : ' + data.msg);
	    },
	    onSuccess : function(data){
	        //do something ...
	    },
	    onTimeout : function(data){
	        //do something ...
	    }

	});	

	http 函数列表:

	serializeParam : function ( param ) {}
	getUrlParam : function ( name ,href ,noDecode ) {}
	ajax : function ( option ) {}
	offlineSend:function(options) {}

- platform 平台检测模块
	
	与 browser 模块类似

	J.platform.android
	J.platform.ieVersion
	J.platform.android
	J.platform.iPhone
	J.platform.iPad
	J.platform.iPod
	J.platform.winPhone 
	J.platform.IOS
	J.touchDevice

- prefix 前缀辅助模块

	J.prefix.dom == 'WebKit'
	J.prefix.lowercase == 'moz'
	J.prefix.css == '-ms'
	J.prefix.js == 'webkit'	

- string 轻量的模板模块
	
	template function(str, data){}
	encodeHtml function(sStr){}
	isURL function(str) {}
	parseURL function(str) {}
	buildURL function(obj) {}

- support 特性检测模块
	
	J.support = {
	    audio : {
	        m4a : 'maybe',
	        mp3 : 'maybe',
	        ogg : 'probably',
	        wav : 'probably'
	    }
	    fixed : true,
	    flash : ture,
	    transitionend : 'transititonend'
	}

- type 类型检查辅助模块
	
	isArray : function(o){}
	isObject : function(o) {}
	isBoolean : function(o) {}
	isNumber : function(o) {}
	isUndefined : function(o) {}
	isNull : function(o) {}
	isFunction : function(o) {}
	isString : function(o) {}		

- util 辅助模块
	
	hideUrlBar:function(){} 隐藏URL栏
	preventScrolling : function() {} 禁止滚动
	activeScrolling:function(){} 启用滚动
	scrollToTop:function(duration,runType){} 滚动到顶部动画(css3动画)
	fixElement:function(ele,options){} 兼容浏览器的fixed定位
	hoverEffect:function(ele,className){}


# 源码阅读笔记 - [JM 源码](https://github.com/AlloyTeam/JM/tree/master/src)

- base.js
	
	// 定义 J 的基础方法
	var J  = {};
	// 挂载到 window
	window.JM = window.J = J;
	// 若检测到 define 加载方式, 则封装为一个包
	if ( typeof define === 'function' ) {
		define(function (){
			return J;
		});
	}

	// J 中定义基础方法
	var J = {
		
		// 创建命名空间, name 形如 "a.b.c"
		$namespace: function(name) {},

		// 将func 挂载到命名空间 ns 中
		$package: function (ns, func) {},

		// 给 value 设置默认值
        $default: function(value, defaultValue){},

		// 将 src 的属性混入 dest 中
		extend: function (dest, src) {},

        // 将 func 绑定到 context 中, 并将 var_args 作为参数调用
		bind:function(func, context, var_args) {},

		// TODO 没读懂
		Class: function () {},

		// 将伪数组转化为真正的数组
        toArray: function(pseudoArrayObj){},

        // 找出 elem 在 arr 中的索引
        indexOf:function(arr,elem){},

        // 对 arry 中每一个元素执行 callback, 若都返回 true 则返回true
        every:function(arr,callback){},

        // 对 arry 中每一个元素执行 callback, 只要有一个返回 true 则返回true
        some:function(arr,callback){},

        // 对 arry 中每一个元素执行 callback
        each:function(arr,callback){},

        // 对 arry 中每一个元素执行 callback, 然后返回一个新的数组
        map:function(arr,callback){},

        // 对 arry 中每一个元素执行 callback, 然后返回一个过滤后的新的数组
        filter:function(arr,callback){},

         // 判断 obj 是否为一个空对象
        isEmptyObject:function(obj){},

        // 生成一个介于 min 和 max 的随机数
        random : function(min, max){},























	}
	

