/*
 * FlowPlayer Popcorn Plugin
 */

$f.addPlugin("popcorn", function() {

	// These values are initialized in flowPlayer.onLoad:
	// * el: FlowPlayer container element, used as proxy/bridge for Popcorn
	// * pctInterval: pollCurrentTime Interval
	// * popcornPlayer: local instance of Popcorn player used by this plugin
	// * lastSetVolume: cache value used by pollCurrentTime
	// * lastSetCurrentTime: cache value used by pollCurrentTime
	var el, pctInterval, popcornPlayer, lastSetVolume, lastSetCurrentTime,

		// initialized in onBegin
		lastClipPlugins = [],

		// FlowPlayer instance
		flowPlayer = this,

		util = {
			forEach: Popcorn.forEach
		},

		// This method triggers Popcorn events
		//
		// Use when: We want Popcorn and FlowPlayer to react to the change
		trigger = function( eventName ) {
			popcornPlayer.trigger( eventName );
		},

		// This method creates and dispatches HTML5 media events
		// on the FlowPlayer container element with a special
		// flag to prevent feedback loops
		//
		// Use when: We want only Popcorn to react to the change
		dispatch = function( eventName, eventInterface ) {
			var event = document.createEvent( eventInterface || "Event" );
			event.initEvent( eventName, false, true );
			// Set a flag so we can elsewhere identify events created
			// by this method
			event._flowplayer_popcorn_ = true;
			el.dispatchEvent( event );
		},

		// This poll handles 3 issues
		// 1. FlowPlayer has no way to get notified as time marches on
		//    (nothing like timeupdate) so we have to poll constantly
		//    to get the current time.
		// 2. The currentTime property can be set directly on the
		//    element and in older browser we have no support for
		//    mutation or setters, so we poll to see if the time
		//    changed that way. If so, update flowPlayer (seek)
		//    based on that new time.
		// 3. The volume property can be set directly on the element
		//    just like currentTime. 
		pollCurrentTime = function() {
			// Check if volume property was changed on element
			if ( lastSetVolume !== el.volume ) {
				lastSetVolume = el.volume;
				// Use trigger instead of dispatch because the source
				// of this event is a property change on the element
				// not a change from FlowPlayer
				trigger( "volumechange" );
			}
			// Check if currentTime property was changed on element
			if ( lastSetCurrentTime !== el.currentTime ) {
				flowPlayer.seek( el.currentTime );
			}
			// Get new time whether set by property set -> seek above
			// or by playback
			var flowplayerTime = flowPlayer.getTime();
			if ( lastSetCurrentTime != flowplayerTime ) {
				el.currentTime = flowplayerTime;
				lastSetCurrentTime = el.currentTime;
				// Use dispatch because if the change didn't come from
				// FlowPlayer, we already took care of that with the
				// above seek, so all that's left is to tell Popcorn
				dispatch( "timeupdate" );			
			}
		},

		// FlowPlayer volume range is 0-100
		// HTML5 media volume range is 0-1
		normalizeVolume = function( volume ) {
			return volume / 100;
		},
		denormalizeVolume = function( volume ) {
			return volume * 100;
		},

		// Volume and currentTime properties need to be set with these
		// methods to ensure consistent cache values.
		// Used in pollCurrentTime to detect whether property changes
		// were made directly.
		elSetVolume = function( volume ) {
			el.volume = volume;
			lastSetVolume = volume;
		},
		elSetCurrentTime = function( time ) {
			el.currentTime = time;
			lastSetCurrentTime = time;
		};

	flowPlayer.onLoad(function() {

		// Grab FlowPlayer's container DOM Element
		// This element acts as a bridge or proxy media element
		// for Popcorn
		// * provides HTML5 media methods that when
		//   called get translated to FlowPlayer method calls
		// * normalizes property names and values from FlowPlayer
		//   onto the DOM Element
		// * normalizes event names and values from FlowPlayer
		//   onto the DOM Element
		el = flowPlayer.getParent();

		// ===================
		// HTML5 Media Methods
		// Native pass-through methods for Popcorn.play() and
		// Popcorn.pause()
		//
		// play, pause
		el.play = function() {
			flowPlayer.play();
		};

		el.pause = function() {
			flowPlayer.pause();
		};

		// ======================
		// HTML5 Media Properties
		//
		// currentTime, duration, ended, muted, paused,
		// playbackRate, readyState, volume

		elSetCurrentTime( 0 );
		// This interval gets cleared in onUnload
		pctInterval = setInterval( pollCurrentTime, 333 );

		// The duration gets set to a numeric value in onBegin
		el.duration = NaN;

		el.ended = false;

		el.muted = false;

		el.paused = true;

		el.playbackRate = 1;

		el.readyState = 4;

		elSetVolume( normalizeVolume(flowPlayer.getVolume()) );

		// Initiliaze the Popcorn player instance using the now
		// ready element
		popcornPlayer = new Popcorn.p.init( el );

		// ==============
		// Popcorn Events
		//
		// timeupdate (see above)
		// muted, unmuted, volumechange, play, pause

		// Map popcorn events to FlowPlayer method calls
		util.forEach({
			"muted": "mute",
			"unmuted": "unmute",
			"volumechange": function() {
				flowPlayer.setVolume( denormalizeVolume(el.volume) );
			},
			"play": "play",
			"pause": "pause"
		}, function( method, eventName ) {
			popcornPlayer.listen(eventName, function( event ) {
				event = event || {};
				// FlowPlayer doesn't need to react to events for
				// for which it is the source
				if ( event._flowplayer_popcorn_ ) {
					return;
				}
				if ( typeof method === "string") {
					flowPlayer[ method ]();
				} else {
					method();
				}
			})
		});

	});

	// =================
	// FlowPlayer Events
	//
	// onLoad (see above)
	// onBegin, onStart, onResume, onPause, onStop, onVolume, onMute,
	// onUnmute, onBeforeSeek, onSeek, onFinish, onUnload
	util.forEach({
		onBegin: function() {
			var clip = flowPlayer.getClip(),
				options = clip.popcorn;
			// Remove the plugins from the previous clip
			util.forEach(lastClipPlugins, function( pluginName ) {
				popcornPlayer.removePlugin( pluginName );
			});
			lastClipPlugins = [];
			// Initialize popcorn plugins based on options passed in
			// to FlowPlayer popcorn plugin
			util.forEach(options, function( obj, pluginName ) {
				obj = Popcorn.isArray( obj ) ? obj : [ obj ];
				util.forEach( obj, function( obj ) {
					popcornPlayer[ pluginName ]( obj );
				});
				lastClipPlugins.push( pluginName );
			});
			setTimeout(function() {
				el.duration = clip.duration;
				dispatch( "durationchange" );
			}, 100);	
		},
		onStart: function() {
			el.paused = false;
			dispatch( "play" );
		},
		onResume: function() {
			el.paused = false;
			dispatch( "play" );		
		},
		onPause: function() {
			el.paused = true;
			dispatch( "pause" );
		},
		onStop: function() {
			el.paused = true;
			dispatch( "pause" );
		},
		onVolume: function( volume ) {
			elSetVolume( normalizeVolume(volume) );
			dispatch( "volumechange" );
		},
		onMute: function() {
			el.muted = true;
			dispatch( "volumechange" );
		},
		onUnmute: function() {
			el.muted = false;
			dispatch( "volumechange" );
		},
		onBeforeSeek: function() {
			dispatch( "seeking" );	
		},
		onSeek: function() {
			dispatch( "seeked" );			
		},
		onFinish: function() {
			el.ended = true;
			dispatch( "ended" );	
		},
		onUnload: function() {
			clearInterval( pctInterval );			
		}
	}, function( fn, eventName ) {
		flowPlayer[ eventName ]( fn );
	});

	// Return the player instance so the plugin call is chainable
	return this;
});
