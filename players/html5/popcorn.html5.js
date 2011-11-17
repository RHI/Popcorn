
(function (Popcorn) {
    Popcorn.video = function (target, sources, attributes) {

        if( ! attributes )
            attributes = {};

        if( ! sources )
            sources = [];

        var container = document.getElementById(target.substr(1));

        var video = createElement('video', attributes);

        var i, s;
        for(i = 0; i< sources.length; i++){
            video.appendChild( createElement('source', sources[i]) );
        }

        container.appendChild(video);

        return Popcorn(video);
    };

    function createElement (tag, attributes) {
        var el = document.createElement(tag);
        for(var k in attributes ){
            el.setAttribute(k, attributes[k].toString() )
        }
        return el;
    }
})(Popcorn);


