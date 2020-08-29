let router_loader = {};

router_loader.init = function(app, router){
    console.log('route_loader.init 호출 ! ');
    initRoutes(app, router);
}


function initRoutes(app, router){
    
}

//밖에서 쓸 수 있게 해줘라 , require 한 곳에서 위의 기능을 쓸 수 있도록 exports 해준다.
module.exports = router_loader;