(function () {

    var $ = jQuery;

    var defaults = {
        autoAdvance : true,
        loop : false
    };

    var Playlist = function (options) {
        if( !( this instanceof Playlist ))
            return new Playlist(options);

        this.config = $.extend({}, defaults, options);
        this._media = [];
        this._events = {};
        this._index = 0;
        this.offscreen = document.createElement('div')

        if( this.config.container )
            this.container = getElement(this.config.container);

        this._containerMap('parentNode');
        this._containerMap('offsetHeight');
        this._containerMap('offsetWidth');
        this._containerMap('getBoundingClientRect');

        this._mediaMap("duration");
        this._mediaMap("muted");
        this._mediaMap("volume");
        this._mediaMap("currentTime");
        this._mediaMap("readyState");
    };

    Playlist.prototype = {

        /* media interface */
        play : function () {
            this.media().play();
        },

        pause : function () {
            this.media().pause();
        },

//        getBoundingClientRect : function () {
//            return this.container.getBoundingClientRect();
//        },


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
                if( this._media.length == 0 )
                    this.container.appendChild(video.container || video);
                else
                    this.offscreen.appendChild(video.container || video);
            }

            this._media.push(video);
        },


        addEventListener : function( evtName, fn ) {
            if ( !this._events[ evtName ] )
                this._events[ evtName ] = [];

            this._events[ evtName ].push( fn );
            return fn;
        },

        dispatchEvent : function( e ) {
            var eventType = e.type || e;
            var self = this;

            // A string was passed, create event object
            var evt = {
                type : eventType,
                target : e.target || self,
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
                    self.dispatchEvent( evt );
                })
            });

            media.addEventListener("play", function (){
//                console.log("play")
            });

            media.addEventListener("pause", function (){
//                console.log("pause")
            });

            media.addEventListener("ended", function (){
                console.log("END")
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
            if( i != null ) {
                var old = this.media();
                this._index = i;
                var media = this.media();

                // reset previous clip
                old.pause();
                old.currentTime = 0;

                media.volume = old.volume;
                media.muted = old.muted;

                if( this.container ) {
                    this.offscreen.appendChild(old.container || old);
                    this.container.appendChild(media.container || media);
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

            if( this._index + 1 == this._media.length )
                this.dispatchEvent("playlistComplete");

            this.next();
        },

        media : function (i) {
            if( i == null)
                i = this._index;
            return this._media[i]
        },

        /* Utilities */
        _containerMap : function (prop ){
            var self = this;
            var container = this.container;

            if( container[prop] instanceof Function){
                self[prop] = function () {
                    return container[prop].apply(container, arguments);
                };
                return;
            }
            var fn = function (val) {
                if( container[prop] )
                if( val !== undefined )
                    container[prop] = val;
                return container[prop];
            };
            defineProperty(self, prop, { get : fn, set : fn });
        },

        _mediaMap : function (prop ){
            var self = this;
            var fn = function (val) {
                if( val !== undefined )
                    self.media()[prop] = val;
                return self.media()[prop];
            };
            defineProperty(self, prop, { get : fn, set : fn });
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
