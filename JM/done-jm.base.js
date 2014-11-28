(function(){
    var J={
        // 创建命名空间
        $namespace: function(name) {
            // 无参则返回window
            if ( !name ) {
                return window;
            }

            // TODO: nsArr 未定义？
            nsArr = name.split(".");
            var ns=window;
         
            for(i = 0 , l = nsArr.length; i < l; i++){
                var n = nsArr[i];
                // 若 ns[n] 命名空间存在则直接返回, 否则创建为 {} 
                ns[n] = ns[n] || {};
                ns = ns[n];
            }

            return ns;
        },

        // 将 func 挂载到命名空间 ns 下
        $package:function(ns,func){
            var target;
            // 第一个参数为函数类型, 说明无第二参数, 默认挂载到 window 中
            if(typeof ns == "function"){
                func=ns;
                target = window; 
            }
            // 若第一个参数为字符串类型, 先将其解析命名空间
            else if(typeof ns == "string"){
                target = this.$namespace(ns);
            }
            else if(typeof ns == "object"){
                target  = ns;
            }
            // 将函数挂载到命名空间中
            func.call(target,this);
        },

        // 将 src 的属性混入 dest 中
        extend:function(destination,source){
            for(var n in source){
                if(source.hasOwnProperty(n)){
                    destination[n]=source[n];
                }
            }
            return destination;
        },

        // 将 func 绑定到 context 中, 并将 var_args 作为参数调用
        bind:function(func, context, var_args) {
            // 将 func 绑定到 context 中, 并将 var_args 作为参数调用
            var slice = [].slice;
            var a = slice.call(arguments, 2);
            return function(){
                return func.apply(context, a.concat(slice.call(arguments)));
            };
        },

        // TODO 没读懂!!!        
        Class:function(){
            var length = arguments.length;
            // 以最后一个参数设置项 option
            var option = arguments[length-1];
            // option 若设置了 init 则作为初始化函数
            option.init = option.init || function(){};
   
            if(length === 2){
                var superClass = arguments[0].extend;
    
                var tempClass = function() {};
                tempClass.prototype = superClass.prototype;

                var subClass = function() {
                    return new subClass.prototype._init(arguments);
                }
              
                subClass.superClass = superClass.prototype;
                subClass.callSuper = function(context,func){
                    var slice = Array.prototype.slice;
                    var a = slice.call(arguments, 2);
                    var func = subClass.superClass[func];
               
                    if(func){
                        func.apply(context, a.concat(slice.call(arguments)));
                    }
                };
                subClass.prototype = new tempClass();
                subClass.prototype.constructor = subClass;
                
                J.extend(subClass.prototype, option);

                subClass.prototype._init = function(args){
                    this.init.apply(this, args);
                };
                subClass.prototype._init.prototype = subClass.prototype;
                return subClass;

            }else if(length === 1){
                // 只传入一个参数
                var newClass = function() {
                    return new newClass.prototype._init(arguments);
                }
                newClass.prototype = option;
                newClass.prototype._init = function(arg){
                    this.init.apply(this,arg);
                };
                newClass.prototype.constructor = newClass;
                newClass.prototype._init.prototype = newClass.prototype;
                return newClass;
            }   
        },

        // 将伪数组转化为真正的数组
        toArray: function(pseudoArrayObj){
            var arr = [], i, l;
            try{
                return arr.slice.call(pseudoArrayObj);
            }
            catch(e){
                arr = [];
                for(i = 0, l = pseudoArrayObj.length; i < l; ++i){
                    arr[i] = pseudoArrayObj[i];
                }
                return arr;
            }
        },

        // 找出 elem 在 arr 中的索引
        indexOf:function(arr,elem){
            var $T= J.type;
            // arr 为数组或类数组
            if(arr.length){
                return [].indexOf.call(arr,elem);
            }
            // arr 为一个对象, 则返回 elem 对应的 key
            else if($T.isObject(arr)){
                for(var i in arr){
                    if(arr.hasOwnProperty(i) && arr[i] === elem){
                        return i;
                    }    
                }
            }
        },

        // 对 arry 中每一个元素执行 callback, 若都返回 true 则返回true
        every:function(arr,callback){
            // 数组或类数组
            if(arr.length){
                return [].every.call(arr,callback);
            }
            // arr 为一个对象
            else if($T.isObject(arr)){
                var flag = true;
                this.each(arr,function(e,i,arr){
                    if(!callback(e,i,arr)) flag = false;
                });
                return flag;
            }
        },

        // 对 arry 中每一个元素执行 callback, 只要有一个返回 true 则返回true
        some:function(arr,callback){
            if(arr.length){
                return [].some.call(arr,callback);
            }
            else if($T.isObject(arr)){
                var flag = false;
                this.each(arr,function(e,i,arr){
                    if(callback(e,i,arr)) flag = true;
                });
                return flag;
            }
        },

        // 对 arry 中每一个元素执行 callback
        each:function(arr,callback){
            var $T = J.type;
            if(arr.length){
                return [].forEach.call(arr,callback);
            }
            else if($T.isObject(arr)){
                for(var i in arr){
                    // 注意这里只对自有属性进行操作
                    if(arr.hasOwnProperty(i))
                        if(callback.call(arr[i],arr[i],i,arr) === false) return;
                }
            }
        },

        // 对 arry 中每一个元素执行 callback, 然后返回一个新的数组
        map:function(arr,callback){
            var $T = J.type;
            if(arr.length){
                [].map.call(arr,callback);
            }
            else if($T.isObject(arr)){
                for(var i in arr){
                    if(arr.hasOwnProperty(i))
                        arr[i] = callback.call(arr[i],arr[i],i,arr);
                }                
            }
        },

        // 对 arry 中每一个元素执行 callback, 然后返回一个过滤后的新的数组
        filter:function(arr,callback){
            var $T = J.type;
            if(arr.length){
                return [].filter.call(arr,callback);
            }
            else if($T.isObject(arr)){
                var newObj={};
                this.each(arr,function(e,i){
                    if(callback(e,i)){
                        newObj[i] = e;
                    }
                });
                return newObj;
            }
        },

        // 判断 obj 是否为一个空对象
        isEmptyObject:function(obj){
            for(var n in obj){
                // obj 中存在属性则返回 false
                return false;
            }
            return true;
        },

        // 生成一个介于 min 和 max 的随机数
        random : function(min, max){
            return Math.floor(Math.random() * (max - min + 1) + min);
        },

        // 给 value 设置默认值
        $default: function(value, defaultValue){
            if(typeof value === 'undefined'){
                // value 未定义则设置默认值
                return defaultValue;
            }
            // 若 value 已被赋值则直接返回
            return value;
        }

    }
    window.JM = window.J = J;

    if ( typeof define === "function") {
        define(function() {
            return J;
        });
    }
})();