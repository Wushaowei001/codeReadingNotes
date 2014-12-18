/**
* 页面模型
* created by dorsywang
* 页面逻辑层的封装
* @2014-7-29 增加注释文档
* @2014-12-08 修改如下
1. 修复了scrollModel要加到mutitab上才会滚动加载的bug
2. 增加了scrollModel可配置自己的scrollEl的选项,不配置默认为renderContainer
3. 增强了model的关系模型，具体支持
	A B互斥关系  mutitab.add(selector, A); mutitab.add(selector, B);
	A B同时出现  page.add(A); page.add(B);
         
	基于上述关系支持如下的复杂度关系
	
	var a = new scrollModel();
	var b = new renderModel();  
	var c = b.extend();

	var d = c.extend();

	var page = new pageModel();
	var mutitab = new mutitabModel();

	page.add(a); page.add(b); page.add(c); // a b c 同时出现关系

	mutitab.add(selector, page);   // page中包含的abc和d互斥出现
	mutitab.add(selector,  d);

	page2.add(mutitab); 
	
	mutitab.add(selector, page2)
	等等
4. 支持mutitab延时加载模块
	mutitab.add(selector, "my");// 延时加载loadjs配置中my对应的所有文件
	
	对应文件实现
	myPage.exportTab(selector);
* 
*/
(function(){
    /**
     * new一个obj
     */
    var newObject = function(func){
        var obj = {};
        func(obj);
        // func 是一个构造函数
        // 将 obj 的原形修改为 func.prototype 这样 obj 就继承了 func 中的属性
        obj.__proto__ = func.prototype;

        return obj;
    };

    /**
     * 根据cgi和参数生成对应的localStorge
     * 要去除类似随机数的参数
     */
    var getKey = function(cgiName, param){
        var o = {};

        for(var i in param){
            // 不存储这些参数
            if(i === "from" || i === "sid" || i === "bkn"){
                continue;
            }

            o[i] = param[i];
        }
        // => /cgi-bin/bar/info_category_{"bid":"10378","n":15,"s":0,"cateid":10,"gflag":1,"sflag":0}
        var key = cgiName + "_" + JSON.stringify(o);

        return key;
    };

    var emptyFunc = function(){};

    // 逐步代替scrollHandle
    // scrollHelper复制一份 便于model控制
    var preScrollTop = 0;

    // scrollHandlerMap 存储了可滚动的 model
    var scrollHandlerMap = {
    };

    var scrollHelper = {

        // Q: 这里的 scrollToHalfCallback 为什么要这么设计(2/3)?
        // Q: 这里的 参数 id 并没有使用到?
        bindEvent: function(container, id, scrollToHalfCallback){
            var scrollDom = container;
            if($.os.ios){
                // 如果 scrollDom 为 body 的话, 修正为 window
                if($(scrollDom)[0] == document.body){
                    scrollDom = window;
                }
            }

            // 监听滚动
            $(scrollDom).on("scroll", function(){
                var preScrollTop = 0;
                // Q: 这个 e 哪里来的?
                // 是不是上面这个 function 的参数忘记写了
                return function(e){
                    var self = this;
                    var container = e.target;
                    var scrollTop,
                        scrollHeight,
                        windowHeight;

                    //android 和 ios 5以下版本
                    if(container == document){
                        scrollTop = window.scrollY;
                        windowHeight = window.innerHeight;
                        scrollHeight = document.body.scrollHeight;
                    }
                    //ios 5+版本
                    else{
                        var style = window.getComputedStyle(container);
                        scrollTop = container.scrollTop;
                        // Q: windowHeight 是否需要添加 parstInt(style.borderTopWidth) 和 parstInt(style.borderBotttomWidth)
                        windowHeight = parseInt(style.height) + parseInt(style.paddingTop) + parseInt(style.paddingBottom) + parseInt(style.marginTop) + parseInt(style.marginBottom);
                        scrollHeight = container.scrollHeight;
                    }


                    //滚动到2/3处
                    // Q: 为啥是 2/2 这么处理?
                    if (scrollTop + windowHeight >= scrollHeight * 2 / 3 && scrollTop > preScrollTop) {
                        scrollToHalfCallback && scrollToHalfCallback(e);
                    }
                    
                    preScrollTop = scrollTop;
                };
            // Q: 这里为什么有 function(){}() ?    
            }());
        },


        // 删除一个 model
        removeModel: function(model){
            var scrollEl = model._scrollEl;
            if(scrollEl){
                var el = scrollEl;
                if(typeof scrollEl == "string"){
                    el = $(scrollEl);
                }

                var id;
                if(el == window){
                    id = '__window__';
                }else{
                    id = el.attr("id");
                }


                if(el && el.length && id){
                    for(var i = 0; i < scrollHandlerMap[id].length; i ++){
                        // 在 scrollHandlerMap 缓存中找到这个 id 对应的 model
                        // 注意每次 addModel 时都会将 model 加入到 scrollHandlerMap 中
                        // 所以 scrollHandlerMap 必定存在这个 id 对应的 model
                        if(scrollHandlerMap[id] === model){
                            break;
                        }
                    }
                    // 删除这个 model
                    // scrollHandlerMap[id] 是一个数组
                    scrollHandlerMap[id].splice(i, 1);
                }
            }
        },

        // 添加一个 model
        addModel: function(model){
            var scrollEl = model._scrollEl;
            var el = scrollEl;
            if(typeof scrollEl == "string"){
                el = $(scrollEl);
            }

            var id;
            // 如果模型对应的 _scrillEl 为 window 的话, 将 '__window__' 作为标识
            if(el == window){
                id = '__window__';
            }else{
                id = el.attr("id");
                if(id){
                    // 存在 id 不使用默认处理
                }else{
                    // 不存在 id 则使用默认处理: 生成一个随机数
                    // 双波浪线的用处是处理掉小数, 也可以理解为是 Math.floor() 的一种替代 http://rocha.la/JavaScript-bitwise-operators-in-practice
                    // 这里可能生成相同的 id, 所在在下方使用了 push 处理
                    id = "d_" + ~~ (100000 * Math.random());
                    el.attr("id", id);
                }
            }

            // 注意 若 scrollHandlerMap[id] 对应的是一个数组
            if(scrollHandlerMap[id]){
                // 若 scrollHandlerMap[id] 已经存在
                scrollHandlerMap[id].push(model);
            }else{
                scrollHandlerMap[id] = [model];
                
                // 给 model 绑定事件
                this.bindEvent(
                    el,
                    id,
                    function(){
                        // 这个回调是 scrollToHalfCallback
                        scrollHandlerMap[id].map(function(item){
                            // Q: canScrollInMTB 表示什么?
                           if(! item.canScrollInMTB){
                               return;
                           }
                           if(item.type == "scrollModel"){
                                if(! item.freezed && item.scrollEnable){
                                    // model 已激活且可滚动
                                    item.rock();
                                }
                            }else{

                                if(! item.freezed && item.currModel.type == "scrollModel" && !item.currModel.freezed && item.currModel.scrollEnable){
                                    // 当前模型中不可滚动, 但 multi tab 中看当前 model 已激活且可滚动
                                    item.currModel.rock();
                                }
                            }
                        });
                    }
                );
            }

        }
    };

    //记录是不是第一次进来
    var isFirstRender = 1;
    var _containerCountInfo = {};
    

    /**
     * 普通的页面渲染模型
     */
    var renderModel = function(opt){
        // 使用空func便于后续支持更便捷的对象继承方式
        // 比如 var a = new RenderModel({});
        //      var b = new a(); // b继承自a
        var func = function(o){
        };
        func.renderTmpl = opt.renderTmpl; //渲染的模板
        func.cgiName = opt.cgiName; //请求的cgi
        func.renderContainer = opt.renderContainer; //要渲染到的dom元素，支持selector和元素
        func.param = opt.param; //请求的参数，可以是对象 或者 function
        func.beforeRequest = opt.beforeRequest  || function(){};
        func.processData = opt.processData; //对数据进行的加工处理 这时不允许对view层做修改
        func.data = opt.data; //如果存在data就会直接用data的数据而不用去请求cgi
        func.renderTool = opt.renderTool; //渲染模板的时候可以传入一个工具函数对象，在view层使用
        func.onreset = opt.onreset; //模型被重置时候做的处理
        func.events = opt.events; //模型注册的事件
        func.complete = opt.complete; //模型完成渲染后进行的操作，这时候可以进行view层的修改
        func.myData = opt.myData; //自定义数据
        func.error = opt.error; //cgi出错时候的处理
        func.noRefresh = opt.noRefresh || 0; //是不是自己提供refresh方法
        func.scrollEl = opt.scrollEl;
        func.noCache = opt.noCache;
        func.prefetch = opt.prefetch;

        func.paramCache = []; //参数的请求缓存
        func.cgiCount = 0; //cgi的请求次数
        func.dataCache = []; //cgi回来的data缓存

        func.feedPool = []; //需要喂养数据的模型池
        func.isFirstRender = 1; //标记是不是第一次渲染模型
        func.eventsBinded = 0; //标记事件是不是被注册绑定过了

        func.isFirstDataRequestRender = 0; //标记是不是第一次发cgi请求进行渲染

        //是否使用预加载模式
        func.usePreLoad = opt.usePreLoad;

        func.__proto__ = renderModel.prototype; //不解释

        func.prototype = func; //不解释

        if(opt.renderContainer){
            if(_containerCountInfo[opt.renderContainer]){
                // 已有渲染容器, 增加1
                _containerCountInfo[opt.renderContainer] ++;
            }else{
                // 第一个渲染容器, 设置为1
                _containerCountInfo[opt.renderContainer] = 1;
            }
        }

        if(func.prefetch){
            // 使用预加载模式
            try{
                // 如果之前有发过请求，则使用缓存的参数池中对应的参数，否则使用param方法构造参数
                var param = (typeof func.param == "object" && func.param) || func.param.call(func);
                func.paramCache[0] = param;

                 var opt = {
                    url: func.cgiName,
                    param: param,
                    succ: function(res){
                        if(typeof func.dataCache[0] === "function"){
                            var fun = func.dataCache[0];
                            func.dataCache[0] = res;
                            fun();
                        }else{
                            func.dataCache[0] = res;
                        }
                    },

                    err: function(res){
                       if(typeof func.dataCache[0] === "function"){
                            var fun = func.dataCache[0];
                            func.dataCache[0] = res;
                            fun('error');
                        }else{
                            func.dataCache[0] = null;
                        }                       
                    }
                 };
                 DB.cgiHttp(opt);

                 // 预加载成功
                 func.dataCache[0] = "@prefeching";
             }catch(e){
                // 预加载出错
                func._prefetchError = 1;
             }
        }

        return func;
    };

    /**
     * 普通渲染模型的原型链
     */
    renderModel.prototype = {
        // 类型
        type: "renderModel",

        // 外放tab
        exportTab: function(selector, onswitch){
            var key = "recieveModel" + selector;
            if(window[key] && typeof window[key] === "function"){
                window[key](selector, this, onswitch);
            }
        },

        // 注意 tell 和 watch 参数相同, 但绑定的方向相反
        // A.tell(B, something, dowhat)
        // tell:  当 A 的 something 属性改变时, 通知给 B, 并让 B 执行 dowhat 操作
        tell: function(somebody, something, dowhat){
            var key = ["__", something, "__"].join("");
            
            // 如相定义了某个属性
            if(typeof this[something] !== "undefined"){
                // Q: 为何要这么赋值?
                this[key] = this[something];
            }else{
                // 什么也不做
            }

            Object.defineProperty(this, something, {
                // 注意这里的 this 指向 somebody
                get: function(){
                    // 返回 somebody.__something__
                    return this[key];
                },

                set: function(val){
                    // 设置 somebody.__something__ 为 val
                    this[key] = val;

                    if(dowhat){
                        // A.tell(somebody, something, dowhat)
                        // 如果指定了 dowhat 回调
                        // 则当 A.something 被修改时, 自动触发: somebody.dowhat(val)
                        dowhat.call(somebody, val);
                    }else{
                        // 双向绑定: 如果 A.tell(somebody, something)
                        // 当 A.something 被修改, 则 somebody.something 也会联动修改
                        somebody[something] = val;
                    }
                }
            });
        },

        // A.watch(B, something, dowhat)
        // watch: 当 B 的 something 属性改变时, 通知给 A, 并让 A 执行 dowhat 操作
        watch: function(somebody, something, dowhat){
            var key = ["__", something, "__"].join("");
            
            // 如相定义了某个属性
            if(typeof somebody[something] !== "undefined"){
                somebody[key] = somebody[something];
            }else{
            }

            var _this = this;

            Object.defineProperty(somebody, something, {
                // 注意这里的 this 指向 somebody
                get: function(){
                    // 返回 somebody.__something__
                    return this[key];
                },

                set: function(val){
                    // 设置 somebody.__something__ 为 val
                    this[key] = val;

                    if(dowhat){
                        // A.watch(somebody, something, dowhat)
                        // 如果指定了 dowhat 回调
                        // 则当 somebody.something 被修改时, 自动触发: A.dowhat(val)
                        dowhat.call(_this, val);
                    }else{
                        // 双向绑定: 如果 A.tell(somebody, something)
                        // 当 somebody.something 被修改, 则 A.something 也会联动修改
                        _this[something] = val;
                    }
                }
            });
        },

        getCache: function(cgiCount){
            if(cgiCount === 0){
                // 返回本地数据
                return this.localData;
            }else{
                // 返回缓存中的数据
                return this.dataCache[cgiCount - 1];
            }
        },

        // cgi取数据
        // 获取数据成功后执行回调 callback(res)
        getData: function(callback){
            var _this = this;
            var localData;

            // 如果之前有发过请求，则使用缓存的参数池中对应的参数，否则使用param方法构造参数
            var param = _this.paramCache[_this.cgiCount] || (typeof this.param == "object" && this.param) || this.param.call(this);

            var opt = {
                url: this.cgiName,
                param: param,
                succ: function(res, isLocalRender){
                   
                    // isLocalRender标记是从localStroage中取到的数据 直接执行回调
                    if(isLocalRender){
                        callback(res);
                        return;
                    }
                    
                    // 更新此次的缓存cgi数据和请求参数数据
                    _this.dataCache[_this.cgiCount] = res;
                    _this.paramCache[_this.cgiCount] = param;

                    // cgi请求参数自增
                    _this.cgiCount ++;

                    // 如果是第一次从cgi请求的数据 则缓存数据到localStrage里面
                    if(_this.cgiCount == 1){
                        var key = getKey(_this.cgiName, param);

                        try{
                            window.localStorage.setItem(key, JSON.stringify(res));
                        }catch(e){
                            window.localStorage.clear();
                            window.localStorage.setItem(key, JSON.stringify(res));
                        }
                    }

                    if(localData){
                        // 匹配这次数据
                        
                        /*
                        var checkDif = function(l, r){
                            for(var i in r){
                                if($.isArray(r[i])){
                                    if($.isArray(l[i]){
                                        for(var j = 0; j < r[i].length; j ++){
                                        }
                                    }
                                }
                            }
                        };
                        */

                        /*
                        for(var i = 0; i < res.length; i ++){
                        }
                        */
                    }


                    //执行回调
                    callback(res);


                },

                err: function(res){
                    _this.paramCache[_this.cgiCount] = param;
                    _this.cgiCount ++;

                    _this.error && _this.error.call(_this, res, _this.cgiCount);
                }
            };


            //使用预加载数据相关逻辑
            if(this.usePreLoad && this.preLoadData){

                //取消预加载模式，方面model后面可以继续使用常规的加载模式
                this.usePreLoad = false;       

                //非正常预加载数据，走原有逻辑发cgi重试
                if(this.preLoadData.type != 'error' && this.preLoadData.retcode == 0){
                    //预加载数据模式的数据保存与渲染
                    opt.succ(this.preLoadData);
                    return;
                } 
                // else{
                    // 出错的话重新先走缓存，再走cgi拉的原有逻辑
                    // this.cgiCount = 0;
                    // this.isFirstRender = 1;
                // }
            }


            //如果是第一次渲染，且cgi也还没有发送请求 那么 使用缓存中数据
            if(!_this.noCache && _this.cgiCount == 0 && _this.isFirstRender){
                
                console.log("Model: try using localCache");

                var key = getKey(this.cgiName, param);

                localData = null;
                try{
                    localData = JSON.parse(window.localStorage.getItem(key) || "{}");
                }catch(e){
                    
                }

                if(localData && localData.result){
                    console.log("Model: has localCache, try succ callback");

                    try{
                        opt.succ(localData, 1);
                    }catch(e){
                        Q.monitor(453668);
                    }
                }

                _this.isFirstRender = 0;

                this.localData = localData;

            }

            /*
            if(this.cgiCount === 0 && ! _this.isFirstRender){
                if(this.prefetch && !this._prefetchError){
                    if(this.dataCache[0]){
                        opt.succ(this.dataCache[_this.cgiCount]);
                    }
                }
            }
            */

            // 如果缓存中有数据 使用缓存数据 否则发送请求
            if(this.dataCache[_this.cgiCount]){
                console.log("Model: using dataCache, cgiCount:" + _this.cgiCount);
                if(this.dataCache[_this.cgiCount] === "@prefeching"){
                    console.log("Model: prefetching data");
                    this.dataCache[_this.cgiCount] = function(isError){
                        console.log("Model: prefetch back, with error:" + isError ? "error" : "noError, cgiCount", _this.cgiCount);

                        console.log("Model: prefeted data:", _this.dataCache[_this.cgiCount])

                        if(! isError){
                            opt.succ(_this.dataCache[_this.cgiCount]);
                        }else{
                            opt.err(_this.dataCache[_this.cgiCount]);
                        }
                    };
                }else{
                    console.log("Model: success callback using dataCache");
                    opt.succ(this.dataCache[_this.cgiCount]);
                }
            }
            //使用预加载数据模式的话，没有缓存也不发请求了，静待预加载数据返回即可
            else if(!this.usePreLoad){
                DB.cgiHttp(opt);
            }
            else{
                _this.paramCache[_this.cgiCount] = param;
            }
        },

        // 清除本地数据
        clearLocalData:function(cgiCount){
            var param = this.paramCache[cgiCount || 0];
            var key = getKey(this.cgiName, param);
            window.localStorage.removeItem(key);
        },

        // 设置预加载数据
        setPreLoadData:function(res){
            this.preLoadData = res;
        },

        /**
         * 模型重置
         * 清空container, 并且用缓存数据重新渲染(如果有缓存数据，没有则继续发布请求)
         */
        reset: function(){
            this.cgiCount = 0;
            this.melt();

            this.onreset && this.onreset();
        },

        // 删除模型, 即在 根据 model 的 id 在 scrollHandlerMap 中删除 model
        die: function(){
            if(this.type === "scrollModel"){
                scrollHelper.removeModel(this);
            }
        },

        // 渲染模型
        // Q: 这里的 isReplace 没有被用到
        render: function(container, isReplace){
            console.log("Model: model scrollEnable:", this.scrollEnable);
            var _this = this;
            this.scrollEnable = 0;
            if(typeof container === "string"){
                container = $(container);
            }
            this.beforeRequest && this.beforeRequest();

            if(this.cgiName){
                this.getData(function(data){

                    if(_this.cgiCount == 1) {
                        _this.onreset && _this.onreset();
                        container.html("");
                    }

                    _this.processData && _this.processData.call(_this, data, _this.cgiCount);

                    if(_this.cgiCount === 0){
                        Tmpl(_this.renderTmpl, data.result || data, _this.renderTool || {}).appendTo(container);
                    }else{
                        Tmpl(_this.renderTmpl, data.result || data, _this.renderTool || {}).appendTo(container, "2fadeIn");
                    }

                    _this.cgiCount > 0 && (_this.scrollEnable = 1);

                    if(_this.eventsBinded){
                    }else{
                        _this.events && _this.events();

                        if(_this.hasOwnProperty("eventsBinded")){
                            _this.eventsBinded = 1;
                        }else{
                            _this.__proto__.eventsBinded = 1;
                        }
                    }

                    _this.feedPool.map(function(item){
                        if (!item.noFeed) {
                            item.setFeedData(data, _this.cgiCount);
                            item.rock();
                        }
                    });

                    _this.complete && _this.complete(data, _this.cgiCount);

                    _this.isFirstDataRequestRender ++;

                });
            }else{
                if(this.data){
                    if(typeof this.data == "function"){
                        this.data = this.data();
                    }
                }else{
                    this.data = {};
                }

                if(this.data){
                    _this.processData && _this.processData.call(this, this.data, _this.cgiCount);

                    container.html("");
                    Tmpl(_this.renderTmpl, this.data.result || this.data, _this.renderTool).update(container);

                    if(_this.eventsBinded){
                    }else{
                        _this.events && _this.events();
                        
                        if(_this.hasOwnProperty("eventsBinded")){
                            _this.eventsBinded = 1;
                        }else{
                            _this.__proto__.eventsBinded = 1;
                        }

                    }

                    _this.scrollEnable = 1;

                    _this.feedPool.map(function(item){
                        if (!item.noFeed) {
                            item.setFeedData(this.data, _this.cgiCount);

                            item.rock();
                        }
                    });

                    _this.complete && _this.complete(this.data, _this.cgiCount);

                    _this.isFirstDataRequestRender ++;
                }
            }
        },

        // 启动入口
        rock: function(){
            this.render(this.renderContainer, 1);
        },

        // 处理数据
        processData: function(data){
            // 实例中覆盖这个方法
        },

        //用自己辛苦拿到的数据哺乳另一个模型
        // 哈哈哈哈 这个好玩
        feed: function(model){
            // 将 model 加入到哺乳池中
            this.feedPool.push(model);
            // 注意这里是引用传递
            model.feeded = 1;
        },

        setFeedData: function(data, cgiCount){
            this.data = data;
            this.cgiCount = cgiCount;
        },

        
        // 用新的数据对更新模型
        update: function(data){
            this.data = data;

            this.reset();
            this.rock();
        },

        //只刷新数据不更新视图
        resetData: function(){
            this.dataCache = [];
            this.cgiCount = 0;

            this.onreset && this.onreset();
        },

        // 重新请求cgi刷新模型
        refresh: function(){
            if(this.noRefresh){
                // 设置了不用刷新, 不做处理
            }else{
                this.dataCache = [];
                this.reset();
                this.rock();
            }
        },

        /**
         * 隐藏模型
         */
        hide: function(){
            var container = this.renderContainer;
            if(typeof container === "string"){
                container = $(container);
            }
            // 直接把 DOM 隐藏
            container.hide();
        },

        /**
         * 显示模型
         */
        show: function(){
            var container = this.renderContainer;
            if(typeof container === "string"){
                container = $(container);
            }
            // 直接把 DOM 显示
            container.show();
        },

        /**
         * 继承模型
         */
        extend: function(opt){
            var func = function(){
            };

            var events = opt.events;

            func.prototype = this;//object;

            var clone = new func();

            clone.feedPool = [];
            clone.cgiCount = 0;
            clone.dataCache = [];
            clone.isFirstDataRequestRender = 0;
            clone.isFirstRender = 1;
            clone._addedToModel = 0;
            clone.canScrollInMTB = 1;

            //如果重新定义了 param 不使用缓存
            if(opt.param){
                clone.paramCache = [];
            }

            for(var i in opt){
                clone[i] = opt[i];
            }

            //如果定义了事件 就不使用原来的事件
            // Q: 这个没搞懂
            if(events){
                clone.events = function(){
                    events && events.call(this);
                };

                clone.eventsBinded = 0;
            }

            if(clone.renderContainer){
                if(_containerCountInfo[clone.renderContainer]){
                    _containerCountInfo[clone.renderContainer] ++;
                }else{
                    _containerCountInfo[clone.renderContainer] = 1;
                }
            }

            return clone;
        },

        // 冰封 model, 冻住了就不能 rock 了
        freeze: function(){
            this.freezed = 1;
        },

        // 解封 model, 解冻后才能 rock 
        melt: function(){
            this.freezed = 0;
        }
    };

    var scrollHanderPool = [];

    /**
     * 普通的页面滚动模型
     */
    var scrollModel = function(opt){
       // 滚动模型继承自渲染模型
       var Render = new renderModel(opt);

       // 可滚动
       Render.scrollEnable = 1;

       Render.__proto__.eventsBinded = 0;
       Render.type = "scrollModel";

       // 模型的滚动元素容器
       Render._scrollEl = opt.scrollEl || ($.os.ios ? "#js_bar_main" : window);

       // Q: 这个属性啥意思?
       Render._ctlByMutitab = 0;

       var events = Render.events;

       // 绑定事件
       Render.events = function(){
            events && events.call(this);
       };

       // 渲染内容
       Render.renderContent = function(){
           this.render(this.renderContainer, 1);
       };

       // 标记是否已被添加到 Model 中
       Render._addedToModel = 0;
       Render.canScrollInMTB = 1;

       Render.rock = function(){
             this.render(this.renderContainer, 1);

             if(! this._addedToModel){
                scrollHelper.addModel(this);

                // 标记已被添加到 Model 中
                this._addedToModel = 1;
             }
       };


       return Render;
    };

    // 虚模型 待实现模型
    // @todo 进一步封装
    var abstractModel = function () {

    };

    abstractModel.prototype = {
        type: "abstractModel",
        hide: emptyFunc,
        show: emptyFunc,
        rock: function(){

        },
        reset: function () {

        },

        refresh: function () {

        },
        freeze: function () {

        },
        resetData: function(){

        }
    };

    var cgiModel = function(opt){
        this.cgiName = opt.cgiName;
        this.param = opt.param;
        this.processData = opt.processData;
        this.complete = opt.complete;
        this.error = opt.error;

        this.paramCache = [];
        this.cgiCount = 0;
        this.dataCache = [];

        this.feedPool = [];
        this.isFirstRender = 1;
        this.eventsBinded = 0;

        this.isFirstDataRequestRender = 0;

    };

    cgiModel.prototype = {
        getData: renderModel.prototype.getData,
        rock: function(){
            var _this = this;

            
            this.myData

            this.getData(function(data){
                _this.processData && _this.processData(data, _this.cgiCount);
                _this.complete && _this.complete(data, _this.cgiCount);
            });
        },

        reset: function(){
            this.dataCache = [];
        },

        refresh: function(){
            this.dataCache = [];
            this.rock();
        },

        extend: renderModel.prototype.extend
    };

    var handlers = {
        onScrollEnd: function(){},
        onScrollToBottom: function(){},
        onScrollToHalf: function(){

            scrollHanderPool.map(function(item, index){
                if(! item.canScrollInMTB){
                    // 不能在 multi tab 中滚动
                    return;
                }
            
                if(item.type == "scrollModel"){
                    // 是未被冰封的可滚动的滚动模型
                    if(! item.freezed && item.scrollEnable){
                        item.rock();
                        return;
                    }
                }else{
                    if(! item.freezed && item.currModel.type == "scrollModel" && !item.currModel.freezed && item.currModel.scrollEnable){
                        item.currModel.rock();
                    }
                }
            });
        }
    };


    /**
     * 多tab切换管理模型
     */
    var mutitabModel = function(){
        this.pool = [];

        // 初始化 multi tab, 默认当前模型为 null
        this.currModel = null;

        this.eventBinded = 0;
    };


    mutitabModel.prototype = {
        // 继承渲染模型的 tell 和 watch 方法
        tell: renderModel.prototype.tell,
        watch: renderModel.prototype.watch,

        // Q: TODO 没看懂这里
        _loadJs: function(index, callback){
            var selector = this.pool[index][0];
            var smodel = this.pool[index][1];
            var key = "recieveModel" + selector;
            var _this = this;
            window[key] = function(selector, model, onswitch){
                if(selector && model){
                    _this.pool[index] = [selector, model, onswitch];

                    window[key] = null;
                    delete window[key];

                    callback && callback();
                }
            };

            loadjs.loadModule(smodel);
        },

        // 绑定切换事件
        _bindSwitchEvent: function(){
            var _this = this;

            if(! this.eventBinded){
                $("body").on("tap", function(e){
                    var target = $(e.target);
                    var containerCountInfo = _containerCountInfo;

                    var currentModel = [];
                    var indexArr = []
                    for(var i = 0; i < _this.pool.length; i ++){
                        var selector = _this.pool[i][0];

                        var hittedEl = target.closest(selector);
                        if(hittedEl && hittedEl.length){
                            currentModel.push(_this.pool[i]);
                            indexArr.push(i);
                        }
 
                    }

                    if(currentModel.length){
                        var item = currentModel[0];
                        var selector = item[0];
                        var smodel = item[1];
                        var onswitch = item[2];

                        if(typeof smodel === "string"){
                            var key = "recieveModel" + selector;
                            window[key] = function(selector, model, onswitch){
                                if(selector && model){
                                    _this.pool[indexArr[0]] = [selector, model, onswitch];

                                    window[key] = null;
                                    delete window[key];

                                    _this.rock(selector);

                                    // 继续load其他资源
                                    /*
                                    setTimeout(function(){
                                        
                                    }, 0);
                                    */
                                }
                            };

                            loadjs.loadModule(smodel);

                            return;
                        }

                        _this.currModel = smodel;

                        smodel.canScrollInMTB = 1;


                        _this.beforeTabHandler && _this.beforeTabHandler.call(_this, selector, 'switch')

                        // render container为空的情况
                        if(! smodel.renderContainer){
                            if(smodel.type === "pageModel"){
                                _this.currModel._switchedToPage();
                            }
                        }else{

                            if(containerCountInfo[smodel.renderContainer] > 1){
                                _this.currModel.reset();
                                _this.currModel.rock();

                            }else{
                                if(smodel.isFirstDataRequestRender > 0){
                                }else{
                                    smodel.rock();
                                }
                            }
                        }

                        if(_this.currModel.type == "linkModel") {
                            _this.tabHander && _this.tabHander.call(_this, selector, 'switch');
                            return;
                        }

                        _this.pool.map(function(item){
                            var s = item[0];

                            if(item[1] !== smodel){
                                if(typeof item[1] !== "string"){
                                    item[1].hide();
                                    item[1].canScrollInMTB = 0;

                                    $(s).removeClass('active')
                                       .removeClass('selected');

                                }
                            }
                        });

                        $(selector).addClass('active')
                            .addClass('selected');
                        smodel.show();


                        onswitch && onswitch.call(_this, 'switch');
                        _this.tabHander && _this.tabHander.call(_this, selector, 'switch');
                    }
                });

                this.eventBinded = 1;
            }else{
            }

        },

        rock: function(_selector){
            var _this = this;

            var initedSmodelInfo;

            var containerCountInfo = _containerCountInfo;    
            for(var index = 0; index < this.pool.length; index ++){
                var item = this.pool[index];
                var selector = item[0];
                var smodel = item[1];
                var onswitch = item[2];

                if(_selector){
                    if(selector === _selector){
                        initedSmodelInfo = [selector, smodel, onswitch, index];
                    }
                }else{
                    if(this.initTab){
                        if(selector === this.initTab) {
                            initedSmodelInfo = [selector, smodel, onswitch, index];
                        }
                    }else{
                        if(index === 0){
                            initedSmodelInfo = [selector, smodel, onswitch, index];
                        }
                    }
                }

            }

           if(! initedSmodelInfo){
                console.info("Model cannot init mutitab, check if selector exists!");

                // 如果没找到inittab 则使用第一个
                var index0 = this.pool[0];
                if(index0){
                    initedSmodelInfo = [index0[0], index0[1], index0[2], 0];
                }else{
                    return;
                }
            }else{
               
            }

            this._bindSwitchEvent();

            var selector = initedSmodelInfo[0];
            var smodel = initedSmodelInfo[1];
            var onswitch = initedSmodelInfo[2]
            var index = initedSmodelInfo[3];

            if(typeof smodel === "string"){
                this._loadJs(index, function(){
                    _this.rock(selector);

                    smodel.scrollEnable = 0;

                    // 延时加载其他资源
                    for(var jj = 0; jj < _this.pool.length; jj ++){
                        if(typeof _this.pool[jj][1] === "string"){
                            _this._loadJs(jj);
                        }
                    }
                });
                return;
            }

            this.beforeTabHandler && this.beforeTabHandler.call(this, selector, 'switch')

            smodel.canScrollInMTB = 1;

            this.currModel = smodel;
            this.currModel.reset();
            this.currModel.rock();


            this.pool.map(function(item){
                var m = item[1];
                if(m !== smodel){
                    if(typeof m === "string"){
                    }else{
                        $(item[0]).removeClass('active')
                                   .removeClass('selected');
                        m.hide();
                        m.canScrollInMTB = 0;
                    }
                }
            });

            $(selector).addClass('active')
                   .addClass('selected');
            
            this.currModel.show();

            this.scrollEnable = this.currModel.scrollEnable;

            onswitch && onswitch.call(this, 'init');
            this.tabHander && this.tabHander.call(this, selector, 'init');
        },

        add: function(selector, smodel, onswitch){
            smodel._modelSelector = selector;
            this.pool.push([selector, smodel, onswitch]);

            smodel.controller = this;

            if(typeof smodel === "string"){
                if(window.loadJsConfig && window.loadJsConfig.modules){
                    if(! window.loadJsConfig.modules[smodel]){
                        console.info("mutitab connot load lazymodel while " + smodel + " not exists in loadJsConfig modules!");
                    }
                }
            }else{
                smodel.scrollEnable = 0;
            }


        },

        beforetabswitch: function(func){
            this.beforeTabHandler = func;
        },
        ontabswitch: function(func){
            this.tabHander = func;
        },

        switchTo: function(selector){
            if($(selector)[0]){
                $(selector).trigger("tap");
                
            }else{
                 var el;
                 if(/^#/.test(selector)){
                     el = $("<div style='display: none;' id='" + selector.replace("#", "") + "'></div>");
                 }else{
                     el = $("<div style='display: none;' class='" + selector.replace(".", "") + "'></div>");
                 }

                 $("body").append(el);

                 el.trigger("tap");
            }
        },

        init: function(tabSelector){
            this.initTab = tabSelector;
        },

        freeze: function(){
            this.freezed = 1;
        },
        melt: function () {
            this.freezed  = 0;
        },

        //冻结当前模型
        freezeCurrent: function(){
            this.currModel.freeze();
        },

        refresh: function(){
            this.currModel.refresh();
        },

        refreshList: function(selector){
            if(this.currModel._modelSelector === selector){
                this.currModel.refresh();
            }else{
                this.currModel.resetData();
            }
        }
    };

    var pageModel = function(opt){
        if(opt && opt.renderContainer){
            this.renderContainer = opt.renderContainer;
        }

        this.models = [];
    };


    pageModel.prototype = {
        tell: renderModel.prototype.tell,
        watch: renderModel.prototype.watch,
        set canScrollInMTB(value){
            this.models.map(function(item){
                item.canScrollInMTB = value;
            });
        },
        type: "pageModel",
        exportTab: renderModel.prototype.exportTab,
        //增加一个渲染模型，大致按cgi去划分
        add: function(model){
            this.models.push(model);
            model.controller = this;

            /*
            if(! this._userSetContainer){
                var container = this.renderContainer;
                var container2;

                if(typeof container === "string"){
                    container = $(container);
                }

                if(typeof model.container === "string"){
                    container2 = $(model.renderContainer);
                }

                this.findAnsestor(container, container2);
            }
            */
        },

        remove: function(model){
            var index;
            this.models.map(function(item, i){
                if(item == model){
                    index = i;

                    model.controller = null;
                }
            });

            if(index){
                this.models.splice(index, 1);
            }
        },

        _switchedToPage: function(){
            this.models.map(function(item){
                if(item.type === "page"){
                    item._switchedToPage();
                }else{
                    // 有container render scroll
                    if(item.renderContainer){
                        if(_containerCountInfo[item.renderContainer] > 1){
                            item.reset();
                            item.rock();
                        }else{
                            if(item.isFirstDataRequestRender > 0){
                            }else{
                                item.rock();
                            }
                        }
                    // 无 mutitab及其他
                    }else{
                        //item.rock();
                    }
                }
            });
        },

        rock: function(){
            this.models.map(function(item){
                if(item.feeded){
                    // 如果 item 被 feed 过, 则说明已经 rock 过了
                }else{
                    // 否则, rock 一下.即使用数据渲染 model
                    item.rock();
                }
            });
        },

        extend: function(){
            var func = function(){};
            func.prototype = this;


            var son = new func();
            son.parent = this;

            for(var i in son){
                son[i].parent = parent[i];
            }

            return son;
        },
        reset:function(){
            this.models.map(function(item){
                item.reset();
            });
        },

        refresh: function(){
             this.models.map(function(item){
                item.refresh();
            });
        },

        hide: function(){
            if(this.renderContainer){
                $(this.renderContainer).hide();
            }else{
                this.models.map(function(item){
                    item.hide();
                });
            }
        },

        show: function(){
            if(this.renderContainer){
                $(this.renderContainer).show();
            }else{
                this.models.map(function(item){
                    item.show();
                });
            }
        }

    };

    var linkModel = function(opt){
        this.param = opt.param;
        this.url = opt.url;
        this.newWindow = opt.newWindow;
        this.popBack = opt.popBack;
        this.checkBack = opt.checkBack;
    };

    linkModel.prototype = {
        type: "linkModel",
        hide: emptyFunc,
        show: emptyFunc,
        rock: function(){
            var query = "";
            var param = this.param;
            if(typeof this.param === "function"){
                param = this.param.call(this);
            }

            if(this.popBack){
                mqq.ui.popBack();
            }

            if(param){
                var tmp = [];
                for(var i in param){
                    tmp.push(i + '=' + (param[i] || ""));
                }

                query = tmp.join("&");
            }

            var url;
            if(query){
                url = this.url + "?" + query;
            }else{
                url = this.url;
            }
            if(url){
                if(this.checkBack){
                    var referer = document.referrer;
                    if(referer.indexOf(this.url) > -1){
                        history.back();
                        return;
                    }else{
                    }
                }

                if(this.newWindow){
                    Util.openUrl(url, true);
                }else{
                    Util.openUrl(url);
                }
            }
        },

        reset: function(){
        }
    };

    window.renderModel = renderModel;
    window.scrollModel = scrollModel;
    window.linkModel = linkModel;
    window.mutitabModel = mutitabModel;
    window.pageModel = pageModel;
    window.cgiModel = cgiModel;
    window.abstractModel = abstractModel;
})();
