J.$package(function(J){
	// 检测用户设备的网络状态 https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API#Browser_compatibility
    // 目前(2014.12.9)只有安卓 2.2 支持, iOS 还未支持
    var c = navigator.connection || {type:0};
    var ct = ["unknow","ethernet","wifi","cell_2g","cell_3g"];
    J.connectType = ct[c.type]; 

    // 监听用户切换网络事件
    // c.addEventListener('typechange', function (){
	  // alert("Connection type is change from " + type + " to " + connection.type);
	// });
});