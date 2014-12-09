//cookie
J.$package(function(J){
    var domainPrefix = window.location.hostname;
    var cookie = {
        // J.cookie.set('name', 'xiaolai', 'qq.com', 'path/to/somewhere', 24)
        // 设置
        set : function(name, value, domain, path, hour) {
            if (hour) {
                var today = new Date();
                var expire = new Date();
                expire.setTime(today.getTime() + 3600000 * hour);
            }
            // 字符串拼接的方式添加 cookie
            // window.document.cookie = 'name=xiaolai; expires=Tue, 09 Dec 2014 01:48:09 GMT; path=path/to/somewhere; domain=qq.com;'
            // 注意这里若未指定 domain, 则默认为当前页面所在的域名 domainPrefix = window.location.hostname
            window.document.cookie = name + "=" + value + "; " + (hour ? ("expires=" + expire.toGMTString() + "; ") : "") + (path ? ("path=" + path + "; ") : "path=/; ") + (domain ? ("domain=" + domain + ";") : ("domain=" + domainPrefix + ";"));
            return true;
        },

        // 获取
        get : function(name) {
            var r = new RegExp("(?:^|;+|\\s+)" + name + "=([^;]*)");
            var m = window.document.cookie.match(r);
            return (!m ? "" : m[1]);
        },

        // 删除
        remove : function(name, domain, path) {
            // 设置一个过去的时间即可删除该 cookie
            window.document.cookie = name + "=; expires=Mon, 26 Jul 1997 05:00:00 GMT; " + (path ? ("path=" + path + "; ") : "path=/; ") + (domain ? ("domain=" + domain + ";") : ("domain=" + domainPrefix + ";"));
        }
    };
    J.cookie = cookie;

});
