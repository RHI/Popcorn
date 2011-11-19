(function () {

    var $ = jQuery;

    var defaults = {
        autoAdvance : true,
        autoPlay : true,
        loop : false
    };

    var Playlist = function (options) {
        if( !( this instanceof Playlist ))
            return new Playlist(options);

        this.config = $.extend({}, defaults, options);
        this._media = [];
        this._events = {};
        this._index = 0;

        if( this.config.container ) {
            this.container = getElement(this.config.container);
            $(this.container).css("overflow", "hidden");
            $(this.container).css("position", "relative");
        }

        // container proxy
        this._containerMap('parentNode');
        this._containerMap('offsetHeight');
        this._containerMap('offsetWidth');
//        this._containerMap('height', 'offsetHeight');
//        this._containerMap('width', 'offsetWidth');
        this.height = this.offsetHeight;
        this.width = this.offsetWidth;
        this._containerMap('style');
        this._containerMap('className');
        this._containerMap('getBoundingClientRect');
        this._containerMap('getElementsByTagName');


        // media proxy
        this._mediaMap("duration");
        this._mediaMap("muted");
        this._mediaMap("volume");
        this._mediaMap("currentTime");
        this._mediaMap("readyState");
        this._mediaMap("children");
        this._mediaFn("canPlayType");
        this._mediaFn("canPlayExt");
        this._mediaFn("play");
        this._mediaFn("pause");
        this._mediaFn("webkitEnterFullScreen");
    };

    Playlist.prototype = {

        /* playlist additions */

        queue : function (video) {
            if( typeof video == "string" )  //eg. "#video1"
                video = document.getElementById(video.substr(1));

            if( video instanceof Popcorn ){
                video = video.media;
                video.container = resolveElement(video);
            }

            this.addListeners(video);

            if( this.container ) {
                var c = $(this.container);
                var el = video.container || video;
                $(el).css('height', '100%' );
                $(el).css('width', '100%' );
                $(el).css('position', 'absolute' );
                $(el).css('top', this._media.length ? "100%" : 0);
                $(el).css('left', '0' );
                c.append(el);
            }

            this._media.push(video);
        },

        addEventListener : function( evtName, fn ) {
            if ( !this._events[ evtName ] )
                this._events[ evtName ] = [];

            this._events[ evtName ].push( fn );
            return fn;
        },

        dispatchEvent : function( type, target) {
            var self = this;
            if( target && !( target === this.current() ) ) {
                return;
            }

            // A string was passed, create event object
            var evt = {
                type : type,
                target : target || self,
                currentTarget : self
            };
            Popcorn.forEach( this._events[ evt.type ], function( listener ) {
                listener.call(self, evt, self );
            });
        },

        addListeners : function (media) {
            var events = String("loadstart progress suspend emptied stalled play pause " +
                "loadedmetadata loadeddata waiting playing canplay canplaythrough " +
                "seeking seeked timeupdate ended ratechange durationchange " +
                "volumechange").split(' ');

            var self = this;
            $(events).each(function (i, val){
                media.addEventListener(val, function (evt) {
                    self.dispatchEvent( evt.type, media );
                })
            });

            media.addEventListener("ended", function (){
                self._onEnd();
            });
        },

        previous : function () {
            var i = this._index;
            if( i > 0 )
                i--;
            else if( this.config.loop )
                i = this._media.length - 1;
            this.index(i);
            return this;

        },

        next : function () {
            var i = this._index;
            if( i + 1 < this._media.length )
                i++;
            else if( this.config.loop )
                i = 0;
            this.index(i);
            return this;
        },

        index : function ( i ) {
            if( i != null && i != this._index ) {
                var old = this.current();
                this._index = i;
                var media = this.current();

                // reset previous clip
                old.pause();
                old.currentTime = 0;

                media.volume = old.volume;
                media.muted = old.muted;

                if( this.container ) {
                    var c = $(this.container);
                    var oc = $(old.container || old);
                    var mc = $(media.container || media);
                    oc.css("top", "100%")
                    mc.css("top", 0)
//                    var offset = $(media.container || media).position().top;
//                    var total = offset + c.scrollTop();
//                    $(this.container).scrollTop( total );

                }

                this.dispatchEvent("trackChange");

                if( this.config.autoPlay )
                    media.play();
            }
            return this._index;
        },

        _onEnd : function () {
            if(! this.config.autoAdvance )
                return;

            if( this._index + 1 == this._media.length ) {
                this.dispatchEvent("playlistComplete");
            }

            this.next();
        },

        media : function (){
            return $.merge([], this._media);
        },

        current : function (i) {
            if( i == null)
                i = this._index;
            return this._media[i]
        },

        /* Utilities */
        _containerMap : function (prop, altprop ){
            var self = this;
            var container = this.container;

            if( ! container )
                return;

            if( altprop === undefined)
                altprop = prop;

            if( container[altprop] instanceof Function){
                self[prop] = function () {
                    return container[altprop].apply(container, arguments);
                };
                return;
            }
            var fn = function (val) {
                if( val !== undefined )
                    container[altprop] = val;
                return container[altprop];
            };
            defineProperty(self, prop, { get : fn, set : fn });
        },

        _mediaMap : function (prop ){
            var self = this;
            var fn = function (val) {
                if( val !== undefined )
                    self.current()[prop] = val;
                return self.current()[prop];
            };
            defineProperty(self, prop, { get : fn, set : fn });
        },

        _mediaFn : function (prop){
            var self = this;
            this[prop] = function () {
                var m = this.current();
                return m[prop].apply(m, arguments);
            }
        }
    };

    function resolveElement (element){
        // resolves popcorn player abstractions back to the real container
        var el = element;
        var i = 0;
        while (el = el.previousElementSibling )
            i++;
        return element.parentNode.children[i];
    }

    function getElement (id ){
        if( typeof id == "object")
            return id;

        if( id[0] == "#" )
            id = id.substr(1);

        return document.getElementById(id);
    }

    function defineProperty (obj, prop, descriptor) {
        if( Object.defineProperty )
            return Object.defineProperty(obj, prop, descriptor);
        descriptor.get && obj.__defineGetter__( prop, options.get);
        descriptor.set && obj.__defineSetter__( prop, options.set);
    }

    window.playlist = Playlist;

    if( window.Popcorn )
        Popcorn.playlist = Playlist;
})();
