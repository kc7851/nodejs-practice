var f = function(){
    console.log('2');
}

var o = {
    func:f
}

var a = o.func;

a();