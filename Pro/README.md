
# core.js

	- Widget 组件基类, 用于创建/初始化/隐藏/显示组件
		
			// 创建
			var widget = new Widget()
			
			// 初始化
			widget._init(el, opts)
			
			// 添加属性
			widget.setOption(opts)

			// 将传入的 opts.tpl 模板插入到容器中 
			widget._create()
			
			// 渲染 DOM
			widget._render()

			// 绑定事件
			widget._bindEvents()

			// 显示组件, 显示时混入 opts 
			widget.show(opts)
			
			// 隐藏组件
			widget.hide()

			// 判断组件是否已经显示
			widget.isShow
	
			// opts 传入的属性
			opts = {
				// widget 选择器
				$el: '#Widget-1', 
				// 是否阻止 touchmove 事件
				preventScroll: true,
				// 显示组件时是否显示遮罩
				mask: true,
				// 显示组件时是否有动画, 有的话在显示时会添加
				animation: true,
			}


	- window.pro.createWidget(name, object, isSingleton, superClass) 创建一个组件
		
		- name 指定了组件的 名字, 将挂载在 window.pro[name]
		- object 将会混入新建的组件中
		- isSingleton 为 true 时, 直接返回一个组件实例
		- superClass 为函数时, 则使用这个 superClass 作为基类创建组件,
		否则使用空的 Widget 进行创建

# dot.js

	// pro.createWidget(name, object, isSingleton, superClass)		
	- 只传入 name 和 object 创建了 Dot 组件类

		pro.createWidget( 'Dot', {
		    options: {
		        type: 'normal',   // normal, new, num => 对应 dot.css 中 - .ui-dot-normal/.ui-dot-num/.ui-dot-new
		        color: 'red',     // red 或 blue => .ui-dot-red/.ui-dot-blue
		        content: '',      // New红点和数字红点需要指定content
		        css: null         // 样式，可以自由控制红点的位置和大小，默认红点在容器的右上角
		    },
		    tpl: '<div></div>',   // 组件模板

		    // 覆写渲染函数
		    _render: function(){
		        var options = this.options;
		        
		        this.$el.removeClass().addClass('ui-dot-' + options.type + ' ' + 'ui-dot-' + options.color).text(options.content);

		        if(options.css){
		            this.$el.css(options.css);
		        }else{
		            this.$el.addClass('ui-dot-tr');     // 位置默认在容器的右上角
		        }
		    }
		});

# mask.js
	
	// pro.createWidget(name, object, isSingleton, superClass)		
	- 传入 name, object 和 isSingleton 创建了 Mask 组件实例

		pro.createWidget( 'Mask', {
			options: {
				animation: true,    // 是否显示动画
				preventScroll: true, // 是否阻止滚动
				tapHide: true, // 是否点击关闭
				// relatedWidget: [Widget], // 关联的遮罩
				// tabHide: function (){ // code here} // 若 tabHide 为函数而非布尔值, 则点击时执行这个函数
			},
			tpl: '<div class="ui-mask"></div>',
			// 覆写事件绑定函数
			_bindEvents: function(){
	            var self = this;

	            var options = this.options;

	            this.$el.on('tap', function(){
	            	// 点击关闭遮罩
	            	if(options.tapHide === true){
	            		// 含有关联遮罩, 同时关闭
						if(options.relatedWidget){
							$.isFunction(options.relatedWidget.hide) && options.relatedWidget.hide();
						}
						self.hide();
					}else if($.isFunction(options.tapHide)){
						options.tapHide();
					}
				});
	        }
		}, true);			

# toast.js
	
	// pro.createWidget(name, object, isSingleton, superClass)		
	- 传入 name, object 和 isSingleton 创建了 Toast 组件实例

		pro.createWidget( 'Toast', {
			options: {
				animation: true,   
				preventScroll: true,
				state: 'warning',	// 三种状态 warning，tips，success，=> 对应 dot.css 中 .ui-icon-warning/.ui-icon-tips/.ui-icon-success
				content: '',        // 提示文字
				duration: 2000      // 提示出现后自动关闭的时间
			},
			tpl: '<div class="ui-toast">\
				  	<i></i>\
				  	<span class="ui-color-white"></span>\
				  </div>',
			// 渲染	  
			_render: function(){
				this.$el.find('i').removeClass().addClass('ui-icon-' + this.options.state);
				this.$el.find('span').text(this.options.content);
			},
			show: function( opts ){
				var self = this;

				this.$super('show', opts);

				if(this.options.duration){
					clearTimeout(this.timer);
					
					this.timer = setTimeout(function(){
						self.hide();
					}, this.options.duration);
				}
			},
		}, true);

# dialog.js
	
	// pro.createWidget(name, object, isSingleton, superClass)		
	- 传入 name, object 和 isSingleton 创建了 Dialog 组件实例

	pro.createWidget( 'Dialog', {
	    options: {
	        mask: true,   		// 遮罩
	        animation: true,	// 动画
	        tapHide: true,		// 点击关闭
	        preventScroll: true, // 阻止滚动
	        title: '提示',      // 标题
	        content: '',        // 内容
	        btnText: ['取消', '确定'], // 按钮文案
	        btnHandle: []
	    },
	    tpl: '<div class="ui-dialog">\
	            <div class="body ui-color-black">\
	                <div class="title"></div>\
	                <div class="content"></div>\
	            </div>\
	            <div class="btns ui-border-1px ui-color-blue">\
	                <div class="btn"></div>\
	                <div class="btn ui-border-1px"></div>\
	            </div>\
	        </div>',
	    _render: function(){
	        var options = this.options;
	        if(options.title){
	            this.$el.find('.title').text(options.title).css('display', 'block');
	        }else{
	            this.$el.find('.title').css('display', 'none');
	        }
	        this.$el.find('.content').html(options.content);
	        this.$el.find('.btn:nth-child(1)').text(options.btnText[0]);
	        if(options.btnText.length > 1){
	            this.$el.find('.btn:nth-child(2)').text(options.btnText[1]).css('display', 'block');
	        }else{
	            this.$el.find('.btn:nth-child(2)').css('display', 'none');
	        }
	    },
	    _bindEvents: function(){
	        var self = this;

	        this.$el.on('tap', '.btn', function(e){
	            var $btn = $(e.currentTarget);

	            // .active 定义在 seed.js 中, 给有点击态的按钮添加 .js-active 后执行回调	
	            $btn.active(function(){
	                self.hide();    // 点击后隐藏dialog

	                // 防止dialog隐藏动画和其他渲染一起出现卡顿
	                setTimeout(function(){
	                    var fn = self.options.btnHandle[$btn.index()];
	                    $.isFunction( fn ) && fn();
	                }, 0); 
	            });
	        });
	    },
	    show: function( opts ){
	        if(!this.$el){
	            this._create();
	            this._render();
	        }

	        // $.env 定义在 seed.js, 判断当前设备环境
	        if($.env.isPoorDevice){
	        	// 兼容旧设备
	            this.$el.css('top', window.scrollY + window.innerHeight/2);
	        }
	        this.$el.addClass('js-before-show');

	        this.$super('show', opts);
	    },
	    hide: function(){
	        this.$el.removeClass('js-before-show');

	        this.$super('hide');
	    }
	}, true);

# page-loading.js
	
	// pro.createWidget(name, object, isSingleton, superClass)		
	- 传入 name, object 和 isSingleton 创建了 PageLoading 组件实例

		pro.createWidget( 'PageLoading', {
		    options: {
		        content: '' // loading 的提示内容
		    },
		    tpl: '<div class="ui-page-loading">\
		            <div class="loading"></div>\
		            <div class="content"></div>\
		        </div>',
		    _render: function(){
		        var options = this.options;
		        
		        this.$el.find('.loading').loading('show');

		        this.$el.find('.content').html(options.content);
		    }
		}, true);

# text-loading.js 和 righ-loading.js 与 page-loading.js 实现类似, 具体差异翻源码

# action-sheet.js
	
	// pro.createWidget(name, object, isSingleton, superClass)		
	- 传入 name, object 和 isSingleton 创建了 ActionSheet 组件实例

	pro.createWidget( 'ActionSheet', {
	    options: {
	        mask: true,
	        animation: true,
	        tapHide: true,
	        preventScroll: true,
	        content: '',  // 可为字符串如'<li>value1</li><li>value2</li>>', 也可为数组如 ['value1','value2']
	        btnHandle: []  // 按钮的事件处理
	    },
	    tpl: {
	        main: '<div class="ui-action-sheet">\
	                <ul class="content"></ul>\
	                <div class="ui-color-blue btn btn-cancel" data-cmd="as-cancel" data-dismiss="true">取消</div>\
	            </div>',
	        ul: '<% for(var i = 0, l = list.length; i < l; i++){\
	                  if(typeof(list[i]) === "string"){\
	             %>\
	                  <li class="ui-color-blue ui-border-1px btn" data-dismiss="true"><%=list[i]%></li>\
	                  <% }else{ %>\
	                  <li <%=list[i].id ? "id="+list[i].id : ""%> class="ui-color-blue ui-border-1px btn <%=list[i].className ? list[i].className : ""%>" data-dismiss="true" <%=list[i].cmd ? "data-cmd="+list[i].cmd : ""%> ><%=list[i].value ? list[i].value : ""%></li>\
	                  <% }\
	            } %>'
	    }, 
	    _render: function(){
	        var options = this.options;

	        if($.isArray(options.content)){
	            this.$el.find('.content').html($.template(this.tpl.ul, { list : options.content }));
	        }else{
	            this.$el.find('.content').html(options.content);
	        } 
	    },
	    _bindEvents: function(){
	        var self = this;

	        this.$el.on('tap', '.btn', function(e){
	            var $btn = $(e.currentTarget);
	            var command = $btn.data('cmd');

	            $btn.active(function(){
	                var fu = null;
	                var index = -1;
	                if(command === 'as-cancel'){
	                    index = self.$el.find('.content').children().length;
	                }else{
	                    index = $btn.index();
	                }
	               
	                if($btn.data('dismiss')){
	                    self.hide();    // 点击后隐藏action-sheet
	                } 

	                if(self.options.btnHandle.length > 0){
	                    fn = self.options.btnHandle[index];
	                    $.isFunction( fn ) && fn();
	                } else if($.isFunction( self.options[command] )){
	                    self.options[command]();
	                }
	            });
	        });
	    }
	}, true);

# carousel.js
	
	function slider ( element, options ) {
		// 将当前元素挂载到 this.$wrap
		var $wrap = this.$wrap = $(element);
	}

	// 其中可配置的 options 为
	options = {
			// 容器宽度
            width : $wrap.width(),
            // webkitTransitionDuration
            webkitTransitionDuration : 300,
            // 当前帧数
            current : 0,
            // 当前距离
            currentpos : 0,
            // 激活循环轮播方式，默认激活
            enableCircleLoop : !!1,
            // 激活自动轮播，默认激活
            // 自动轮播激活前提是激活了circle轮播方式
            enableAutoLoop : !!1,
            // 激活触点导航控件
            enableDots : !!1,
            // 自动轮换时长
            autoLoopDuration : 5e3
	}

	// 其中可用的方法有
	
	// 跳转到: index 指定跳转到哪一帧, noanimation 指定是否禁用动画
	slider.to(index, noanimation)

	// 清除轮播
	slider.clear()

	// 生成轮播实例的方法
	// HTML
	<div id="carousel-id" data-carousel="{ width: 100, current: 0}"> other html here... </div>
	// JS	
	var option = { enableDots: true}
	// 使用 option 和 data-carousel 指定的配置生成一个轮播实例
	$("#carousel-id").carousel(option)
	// 跳转到第 3 页
	$("#carousel-id").carousel(3)
	// 清除轮播
	$("#carousel-id").carousel('clear')

# tab.js
	
	// HTML 
	<div id="tab-id" data-target="relate-selector-id"></div>

	 $("#tab-id").tab({
	     $el: '.ui-tab',	//tab item 父层通常为ul
	     content: [],
	     currentIndex: 0,
	     relateSelector:[], //可选，表示tab关联的下面的容器，可用data-target="#relate-selector-id"写在HTML中
	     onSwitchTab: function(index,item){} //监听tab切换函数,index:第几个tab; item: 当前tab
	 })

# mult-selector.js
	
	多级下拉菜单, 最多支持三级
	// window.pro.createWidget(name, object, isSingleton, superClass)
	- 只传入 name 和 object 创建了 MultSelector 组件类
		
		pro.createWidget('MultSelector', {
			options: {
				mask: true,      // 含遮罩
		        animation: true, // 含过渡效果 
		        tapHide: true,   // 点击隐藏
		        selected: [],   
		        option: [],
		        effect: "from-top",
		        maxRoot: 4,
		        onShowChild : function () {},
		        onChangeChild : function () {},
		        onSelect : function () {}
			},

			$roots: null,
			$body: $(document.body),
			currShowing: null,
			tpl: {},
			showSubPanel(root, child) {}, // 显示子菜单
			hide(),		// 隐藏下拉菜单
			add(index, root), // 增加子菜单
			reset(index, opt) // 以 opt 重置 index 指定的菜单
		});

# bouncefix.js

	这段 fix 脚本只在 iOS>=6 时生效

# lazyload.js
	
	懒加载
	// window.pro.createWidget(name, object, isSingleton, superClass)
	- 只传入 name 和 object 创建了 Lazyload 组件类
	
		pro.createWidget( 'Lazyload', {
		    options: {
		        attribute: 'data-lazy',   // HTML 元素含有 data-lazy 则启动懒加载功能

		        viewWidth: window.innerWidth*2,  // 默认懒加载为两屏
		        viewHeight: window.innerHeight*2,   
		        
		        handler: function($el, src){
		            // 给 $el 选择器下的第一个 img 设置 src
		        },

		        defer: 200
		    },
		  
		    startLoad: function(){
		    	// 启动懒加载
		    }
		});

# loading.js
	
	使用 canvas 制作 loading 的菊花
	// window.pro.createWidget(name, object, isSingleton, superClass)
	- 只传入 name 和 object 创建了 Loading 组件类

		pro.createWidget( 'Loading', {
		    options: {
		        size: 30,         // 宽和高

		        lineWidth : 2,    // 每一条的高度(px)
		        lines: 12,        // Loading 条数

		        color : '158,158,158',  // 颜色, 必须为 "R,G,B" 格式

		        duration: 1.6        // 动画时间(s)
		    },
		    tpl: '<canvas></canvas>'
		});

# scrollTo.js
		
	// position 为高度数字, animation 布尔值表示是否使用动画	
	  $.fn.scrollTo = function(position, animation){}
	
# state.js

	这段脚本扩充按钮, 使得按钮含有点击态

	$('#btn-id').active(function (){
		// 按钮首先会添加 className, 默认为 'js-active',
		// 然后执行这个匿名函数,
		// 最后按钮会删除 className
	}, className)

	$('#btn-id').change(className, function () {
		// 按钮若无 className 则添加,
		// 若有则删除,
		// 然后执行这个匿名函数 
	})

# 疑问

coupon/js/lib/pro/carousel.js line-6 'use stick' 应该是 'use strict'


# base.css

- .ui-clear-fix  清除浮动

- .ui-border-1px 1px边框

- .ui-no-wrap 单行文字超长显示省略号

- .ui-multi-no-wrap  多行文字超长显示省略号 

- ui-color-value 字体颜色, 其中 value 可为

	- black

	- white

	- gray

	- blue

	- red

	- orange


# layout.css

- .ui-app 命名空间, 添加给 body

- .ui-header, .ui-footer 固定的头部和底部

- .ui-content-container  内容容器

- ???.js-bounce-fix  iOS6下给 .ui-content-container 而不是 body 设置滚动条, 可模拟原生系统的下拉滚动效果  line-52

- .poor-device .ui-header兼容低版本浏览器

# icon.css 

- .ui-icon 图案

- .ui-icon .ui-bg-default 默认背景企鹅图案占位
- .ui-icon .ui-bg-shop   吃喝玩乐图案
- .ui-bg-default.js-loaded 图案加载完后隐藏默认图案占位

- .ui-icon-arrow 箭头指向左下角
- .ui-icon-arrow.ui-arrow-big 大箭头
- .ui-icon-arrow.ui-arrow-down 箭头指向正下方

# button.css

- .ui-btn, .ui-btn-block 按钮

- .ui-btn[disable], .ui-btn-block[disable] 禁用按钮

- ui-btn-[value] 按钮颜色, 其中 [value] 可为
	
	- white
	- blue
	- red
	- orange

- ui-btn-[value].js-active 激活按钮	

- .ui-btn > .icon, .ui-btn-block > .icon 按钮中含图案

- .ui-btn > .text, .ui-btn-block > .text 按钮中含文字

# corner-tag.css

- .ui-corner-tag 边角标记

- .ui-corner-tag [class*="ui-tag-"]  其中 ui-tag-[value] 为定制标记

- .ui-tag-[value] 标记颜色, 其中 [value] 可为

	- red
	- orange
	- blue
	- green


# dot.css

- .ui-dot-normal 标记一个点

- .ui-dot-num  带数字的点

- .ui-dot-new  表示新内容的点

- .ui-dot-tr 定位在右上角

- .ui-dot-small 小的点

- .ui-dot-[value] 标记颜色, 其中 [value] 可为
	
	- red
	- blue

# mask.css

- .ui-mask  遮罩

- .ui-mast.js-effect 添加过渡效果

- .ui-mask.js-show   显示遮罩


# toast.css

- .ui-toast

- .ui-toast.js-effect

- .ui-toast.js-show

- .ui-toast i

- .ui-icon-[value] 标记抓状态, 其中 [value] 可为

	- warning
	- tips
	- success

# dialog.css

- .ui-dialog 对话框

- .poor-device .ui-dialog 兼容旧设备

- .ui-dialog.js-effect 添加过渡效果

- .ui-dialog.js-before-show 添加过渡效果

- .ui-dialog.js-show 添加过渡效果

- .ui-dialog .body 主体

- .ui-dialog .title 标题

- .ui-dialog .content 内容

- .ui-dialog .btns 按钮组

- .ui-dialog .btn 按钮

- .ui-dialog .btn.js-active 激活按钮

# page-loading.css

- .ui-page-loading 

- .ui-page-loading .loading 

- .ui-page-loading .content 

# text-loading.css

- .ui-text-loading 

- .ui-text-loading .loading 

- .ui-text-loading .content 

# rich-loading.css

- .ui-rich-loading

- .ui-rich-loading .loading

- .ui-rich-loading .content

- .ui-rich-loading .btn

- .ui-icon-close


# action-sheet.css

- .ui-action-sheet  菜单

- .ui-action-sheet .ui-actionsheet-title 菜单标题

- .ui-action-sheet .ui-actionsheet-del

- .ui-action-sheet.js-effect 添加过渡效果

- .ui-action-sheet.js-show   显示菜单

- .ui-action-sheet .btn 按钮

-  .ui-action-sheet .btn.js-active 激活按钮

- .ui-action-sheet .btn-cancel 取消按钮


# ui-carousel.css

- .ui-carousel 轮播图

- .ui-carousel-inner 容器

- .ui-carousel-item 

- .ui-carousel-item-last

- .ui-carousel-dots 

- .ui-carousel-dots-i 

- .ui-carousel-dots-curr 


# tab.css

- .ui-tab 

- .ui-tab .item  

- .ui-tab .item span

- .ui-tab .item.js-active

# form.css

- .ui-form-wrapper 容器

- .ui-form-wrapper .title 标题

- .ui-form  表单

- .ui-form .item 表单项

- .ui-form .item .content 表单项内容

# multselect.css

- .ui-multselect 多选

- .ui-multselect-selected 选中项

- .ui-multselect-selected.active 激活选中项

- .ui-selected-text-wrap 选中文字的容器

- .ui-selected-text 选中文字

- .ui-multselect-[value]grid, 网格宽度, 其中 [value] 可为
	
	- 1, 对应宽度100%
	- 2, 对应宽度5%
	- 3, 对应宽度33.33%
	- 4, 对应宽度25%
	- 5, 对应宽度20%


- .ui-multselect-selected .ui-icon-arrow

- .ui-multselect-root-more .ui-icon-arrow

- .ui-multselect-selected.active .ui-icon-arrow

- .ui-multselect-selected.active .ui-selected-text

- .ui-multselect-panel 多选框面板

- .poor-device .ui-multselect-panel 兼容旧设备

- .ui-multselect-panel.from-top

- .ui-multselect-panel.from-bottom

- .ui-multselect-panel.no-third

- .ui-multselect-panel.no-third .ui-multselect-child.left

- .ui-multselect-panel.no-third .ui-multselect-child.right

- .ui-multselect-child

- .ui-multselect-child.left

- .ui-multselect-child.left .ui-multselect-child-li:after

- .ui-multselect-child.right

- .ui-multselect-child-li

- .ui-multselect-child-li.no-more .ui-icon-arrow

- .ui-multselect-child-li.active

- .ui-multselect-child-li-icon

- .ui-multselect-child.left .ui-multselect-child-li.active

- .ui-multselect-child-text


# 疑问

- .ui-color-value, .ui-btn-value, .ui-tag-value 含有的值不统一?

- 有 - .ui-mask.js-show 但没有 - .ui-mask.js-hide?

- icon.css 中只有几个 icon, 而在其他 css 如 rich-loading.css 中也有分散的 icon 存在, 是否需要聚合到一起? 


