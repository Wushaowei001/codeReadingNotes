// detect vender prefix
J.$package(function(J){
    var styles, pre, dom;

    if(window.getComputedStyle){
        styles = window.getComputedStyle(document.documentElement, '');
        // styles => 一个类数组
        // Array.prototype.slice.call(styles) => 转化为数组
        // Array.prototype.slice.call(styles).join('') => 转化为字符串
        pre = (Array.prototype.slice
            .call(styles)
            .join('')
            .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
        )[1];
        dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

        // 将多种格式的前缀格式返回
        J.prefix = {
            dom: dom,
            lowercase: pre,
            css: '-' + pre + '-',
            js: pre
        };
    }
    // IE8- don't support `getComputedStyle`, so there is no prefix
    else{
        J.prefix = {
            dom: '',
            lowercase: '',
            css: '',
            js: ''
        }
    }
});