JX Cheat Sheet http://alloyteam.github.io/JX/doc/jx_cheatsheet.html


# J = Jx()

J.$return(val)
生成一个返回值是传入的 val 值的函数

J.$try(funcA, funcB, funcC...)
从第一个函数开始try，直到尝试出第一个可以成功执行的函数就停止继续后边的函数，并返回这个成功执行的函数结果

# D = Jx().dom

大量操作 dom 的方法，调用和 jq类似

D.show(el, displayStyle)
以指定方式如：block，inline，inline-block 显示元素

D.recover(el)
还原元素原来的display属性

# E = Jx().event

E.addObserver(targetModel, eventType, handler)
为自定义Model添加事件监听器

E.addObservers({targetModel : {eventType:handler,eventType2:handler2...} ,... })
批量为自定义Model添加事件监听器

E.notifyObservers(targetModel, eventType, argument)
触发自定义Model事件的监听器

E.removeObserver(targetModel, eventType, handler)
移除自定义 Model 事件监听器

# JSON = Jx().json

这两个方法和标准的 JSON 处理方法差不多

JSON.parse(text, reviver)
解析JSON格式字符串

JSON.stringify(value, replacer, space)
序列化为JSON格式字符串


# Jx().date.format(date, formatString) 

    var d = new Date();
    // 以 YYYY-MM-dd hh:mm:ss 格式输出 d 的时间字符串
    J.date.format(d, "YYYY-MM-DD hh:mm:ss");

# Jx().number.format(num, pattern)

# C = Jx().cookie

C.set(name, value, domain, path, hour)
设置一个cookie

C.get(name)
获取指定名称的cookie值

C.remove(name, domain, path)
删除指定cookie,复写为过期


# H = Jx().http

    H.ajax("cgi.web2.qq.com",{
        method: "GET",
        data: null,
        arguments: null,
        onSuccess: function(){},
        onError: function(){},
        onComplete: function(){},
        onTimeout: function(){},
        isAsync: true,
        timeout: 30000,
        contentType: "utf-8",
        type:  "xml"
    });

# S = Jx().string

S.isURL(string)
判断是否是一个可接受的 url 串

S.parseURL(string)
分解 URL 为一个对象，成员为：scheme, user, pass, host, port, path, query, fragment

S.mapQuery(uri)
将 uri 的查询字符串参数映射成对象

S.contains(string1, string2, separator)
判断是否含有指定的字符串

S.camelCase(string)
将“-”连接的字符串转换成驼峰式写法

S.hyphenate(string)
将驼峰式写法字符串转换成“-”连接的

S.toHtml(string)
将字符串转换成html源码

S.byteLength(string)
计算字符串的字节长度

S.cutRight(string, n)
截取指定长度字符串

S.isNumber(string)
是否为数字

S.isEmail(string)
是否为邮箱格式字符

S.vaildUrl(url)
验证并规格化URL: http://web.qq.com/

S.getCharWidth(str,fontsize)
获取字符实际显示宽度

S.cutByWidth(str,fontsize,width)
截取字符串显示宽度


# A = Jx().array

A.toArray(o)
将任意变量转换为数组的方法

A.remove(arr, members)
从数组中移除一个或多个数组成员

A.replace(arr, oldValue, newValue)
替换一个数组成员

A.uniquelize(arr)
唯一化一个数组，由不重复元素构成

A.intersect(arr1, arr2)
求两个集合的交集

A.minus(arr1, arr2)
求两个集合的差集

A.union(arr1, arr2)
求两个集合的并集

# Jx().$package 创建包

    //创建一个名字为alloy.app.demo的package包：
    Jx().$package("alloy.app.demo", function(J){
         //这时上下文对象this指向window对象下的alloy.app.demo对象
         alert("Hello world! This is " + this);
    };

# new J.Class() 创建类

    Jx().$package(function(J){
        // 创建Person类
        var Person = new J.Class({
            init : function(name){
               this.name = name;
               alert("init");
            },
            showName : function(){
               alert(this.name);
            }
        });

        // 继承Person类
        var Programer = new J.Class({extend : Person}, {
            init : function(name){
               this.name = name;
               alert("init");
            },
            showName : function(){
               alert(this.name);
            }
        });
    };

# new ClassName() 创建实例
    
    var p1= new Programer("programer1");
    var p2= new Programer("programer2");




创建命名空间

    Jx().$namespace("xiaolai");
    console.log(window.xiaolai);

创建一个包

    Jx().$package("xiaolai", function(J){
    this.abc = 'fasdf';
        // 此时 this 指向 window.xiaolai
        console.log(window.xiaolai === this); // true
    });



阅读顺序

jx.core
jx.dom
jx.event
jx.cookie 
jx.http
