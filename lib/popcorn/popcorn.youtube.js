/*
 patched version:
 https://github.com/RHI/Popcorn/blob/cb0db2368b38faac75634f3093a36c386e4c749d/lib/popcorn/popcorn.youtube.js
*/

// A global callback for youtube... that makes me angry
var onYouTubePlayerReady = function( containerId ) {

  onYouTubePlayerReady[ containerId ] && onYouTubePlayerReady[ containerId ]();
};
onYouTubePlayerReady.stateChangeEventHandler = {};

Popcorn.player( "youtube", {
  _setup: function( options ) {

    var media = this,
        youtubeObject,
        container = document.createElement( "div" ),
        currentTime = 0,
        seekTime = 0,
        seeking = false,

        // state code for volume changed polling
        volumeChanged = false,
        lastMuted = false,
        lastVolume = 100;

    container.id = media.id + Popcorn.guid();

    media.appendChild( container );

    var youtubeInit = function() {

      var flashvars,
          params,
          attributes,
          src,
          width,
          height,
          query;

      // expose a callback to this scope, that is called from the global callback youtube calls
      onYouTubePlayerReady[ container.id ] = function() {

        youtubeObject = document.getElementById( container.id );

        // more youtube callback nonsense
        onYouTubePlayerReady.stateChangeEventHandler[ container.id ] = function( state ) {

          // playing is state 1
          // paused is state 2
            if ( state === 1 ) {
                media.paused && media.pause();
                // youtube fires paused events while seeking
                // this is the only way to get seeking events
          } else if ( state === 2 ) {

            // silly logic forced on me by the youtube API
            // calling youtube.seekTo triggers multiple events
            // with the second events getCurrentTime being the old time
            if ( seeking && seekTime === currentTime && seekTime !== youtubeObject.getCurrentTime() ) {

              seeking = false;
              youtubeObject.seekTo( currentTime );
              return;
            }

            currentTime = youtubeObject.getCurrentTime();
            media.dispatchEvent( "timeupdate" );
            !media.paused && media.pause();
            }
            else if ( state === 0 ) {
                media.paused = true;
                media.dispatchEvent( "ended" );
            }

        };

        // youtube requires callbacks to be a string to a function path from the global scope
          youtubeObject.addEventListener( "onStateChange", "onYouTubePlayerReady.stateChangeEventHandler." + container.id );


        var timeupdate = function() {

          if ( !media.paused ) {

            currentTime = youtubeObject.getCurrentTime();
            media.dispatchEvent( "timeupdate" );
            setTimeout( timeupdate, 10 );
          }
        };

        var volumeupdate = function() {

          if ( lastMuted !== youtubeObject.isMuted() ) {

            lastMuted = youtubeObject.isMuted();
            media.dispatchEvent( "volumechange" );
          }

          if ( lastVolume !== youtubeObject.getVolume() ) {

            lastVolume = youtubeObject.getVolume();
            media.dispatchEvent( "volumechange" );
          }

          setTimeout( volumeupdate, 250 );
        };

        media.play = function() {
          media.paused = false;
          media.dispatchEvent( "play" );

          media.dispatchEvent( "playing" );
          timeupdate();
          youtubeObject.playVideo();
        };

        media.pause = function() {
            media.dispatchEvent( "pause" );
            youtubeObject.pauseVideo();
        };

        Popcorn.player.defineProperty( media, "currentTime", {
          set: function( val ) {

            // make sure val is a number
            currentTime = seekTime = +val;
            seeking = true;
            media.dispatchEvent( "seeked" );
            media.dispatchEvent( "timeupdate" );
            youtubeObject.seekTo( currentTime );
            return currentTime;
          },
          get: function() {

            return currentTime;
          }
        });

        Popcorn.player.defineProperty( media, "muted", {
          set: function( val ) {

            if ( youtubeObject.isMuted() !== val ) {

              if ( val ) {

                youtubeObject.mute();
              } else {

                youtubeObject.unMute();
              }

              lastMuted = youtubeObject.isMuted();
              media.dispatchEvent( "volumechange" );
            }

            return youtubeObject.isMuted();
          },
          get: function() {

            return youtubeObject.isMuted();
          }
        });

        Popcorn.player.defineProperty( media, "volume", {
          set: function( val ) {

            if ( youtubeObject.getVolume() / 100 !== val ) {

              youtubeObject.setVolume( val * 100 );
              lastVolume = youtubeObject.getVolume();
              media.dispatchEvent( "volumechange" );
            }

            return youtubeObject.getVolume() / 100;
          },
          get: function() {

            return youtubeObject.getVolume() / 100;
          }
        });

        media.pause();
        media.readyState = 4;
        media.dispatchEvent( "canplaythrough" );
        media.dispatchEvent( "load" );
        media.duration = youtubeObject.getDuration();
        media.dispatchEvent( "durationchange" );
        volumeupdate();

        media.dispatchEvent( "loadeddata" );
      };

      options.controls = +options.controls === 0 || +options.controls === 1 ? options.controls : 1;
      options.annotations = +options.annotations === 1 || +options.annotations === 3 ? options.annotations : 1;

      flashvars = {
        playerapiid: container.id
      };

      params = {
        wmode: "transparent",
        allowScriptAccess: "always"
      };

      attributes = {
        id: container.id
      };

      src = /^.*(?:\/|v=)(.{11})/.exec( media.src )[ 1 ];
      query = ( media.src.split( "?" )[ 1 ] || "" ).replace( /v=.{11}/, "" );

      // setting youtube player's height and width, default to 560 x 315
      swfobject.embedSWF( "//www.youtube.com/e/" + src + "?" + query + "&enablejsapi=1&playerapiid=" + container.id + "&version=3",
                          container.id, "100%", "100%", "8", null, flashvars, params, attributes );
    };

    if ( !window.swfobject ) {

      Popcorn.getScript( "//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js", youtubeInit );
    } else {

      youtubeInit();
    }
  }
});

