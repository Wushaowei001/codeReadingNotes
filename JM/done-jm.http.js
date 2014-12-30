//http
J.$package(function(J){
    var http = {
        // {a:1, b:2} => "a=1&b=2"
        serializeParam : function ( param ) {
            if ( !param ) return '';
            var qstr = [];
            for ( var key in  param ) {
                // 参数字符串需要放到 URL 中, 所以注意记得 encodeUIRComponent
                qstr.push( encodeURIComponent(key) + '=' + encodeURIComponent(param[key]) );
            };
            return  qstr.join('&');
        },
        getUrlParam :  function ( name ,href ,noDecode ) {
            var re = new RegExp( '(?:\\?|#|&)' + name + '=([^&]*)(?:$|&|#)',  'i' ), m = re.exec( href );
            var ret = m ? m[1] : '' ;
            return !noDecode ? decodeURIComponent( ret ) : ret;
        },
        ajax : function ( option ) {
            // option = {
            //     method: 'post',
            //     param: {a:1, b:2},
            //     timeout: 3600,
            //     withCredentials: true,
            //     async: true,
            //     onSuccess: function (data, xhr) {
            //      // 成功返回数据 data, xhr 指向自己
            //     },
            //     onError: function (xhr) {
            //      // 返回数据失败
            //     },
            //     onTimeout: function (xhr) {
            //      // 超时
            //     },
            //     error: function () {
            //      // 调用 ajax 错误
            //     }
            // }
            var o = option;
            var m = o.method.toLocaleUpperCase();
            var isPost = 'POST' == m;
            var isComplete = false;
            var timeout = o.timeout;
            var withCredentials = o.withCredentials;//跨域ajax

            // Q: 这里为什么要用 async in option 做判断? 直接用 option.async 不好么? 
            var async = ('async' in option) ? option.async : true;//默认为异步请求, 可以设置为同步

            var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : false;
            if ( !xhr ) {
                // 注意这里是 JM, 不用兼容低版本的 PC 浏览器, 自然就不回退到创建低版本的 XHR 了
                 o.error && o.error.call( null, { ret : 999 , msg : 'Create XHR Error!' } );
                 return false;
            }

            var qstr = http.serializeParam( o.param );

            // get 请求 参数处理
            // 不是 POST 请求, 则将参数添加到 URL 中, 使用 GET 请求
            !isPost && ( o.url += ( o.url.indexOf( '?' ) > -1 ?  '&' : '?' ) + qstr );
            
            xhr.open( m, o.url, async );
            if(withCredentials) xhr.withCredentials = true;

            isPost && xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
            var timer = 0;

            xhr.onreadystatechange = function(){
                if ( 4 == xhr.readyState ) {
                    var status = xhr.status;
                    // 当 ajax 被取消(比如用户刷新页面)时, status 可能为 0 
                    // 当 ajax 被缓存时, status 为 304
                    if ( (status >= 200 && status < 300) || status == 304 || status == 0) {
                        var response = xhr.responseText.replace( /(\r|\n|\t)/gi, '' );
                        var json = null;
                        // 尝试将返回数据 JSON 化
                        try{
                            json = JSON.parse(response);
                        }catch(e){}
                        o.onSuccess && o.onSuccess(json,xhr);
                    }else{
                        o.onError && o.onError(xhr, +new Date - startTime);
                    };

                    // xhr.readyState 为 4 时表示完成
                    isComplete = true;

                    // 完成之后取消定时器
                    if(timer){
                        clearTimeout(timer);
                    }
                }
                
            };
            
            // 发送前记录下时间
            var startTime = +new Date;
            xhr.send( isPost ? qstr : void(0) );
            
            // 若设置了超时, 时间到了还未完成请求, 则取消 ajax 
            if(timeout){
                timer = setTimeout(function(){
                    if(!isComplete){
                        xhr.abort();//不abort同一url无法重新发送请求？
                        o.onTimeout && o.onTimeout(xhr);
                    }
                },timeout);
            }

            return xhr;
        }
    }
    J.http = http;
});