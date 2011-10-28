
var popc, el;

module("Flowplayer Popcorn Plugin", {
	setup: function() {
		flowp.setVolume( 50 );
		flowp.seek( 0 );
		el.currentTime = 0;
	},
	teardown: function() {
		el.muted = false;
		popc.unmute();
		flowp.unmute();
	}
});

function beginTests() {
	// Note: Popcorn.instances is internal to Popcorn.
	// It is used here because the popcorn instance initialized
	// by the FlowPlayer Popcorn Plugin is not exposed (this is
	// by design). 
	// Translation: don't ever use Popcorn.instances except here
	popc = Popcorn.instances[0];
	el = popc.media;

	test("init", function() {

		equal( el.ended, false, "Ended should initialize at false");

		equal( el.muted, false, "Muted should initialize at false");

		equal( el.paused, true, "Paused should initialize at true");

		equal( el.playbackRate, 1, "Playback Rate should initialize at 1");

		equal( el.readyState, 4, "Ready State should initialize at 4");

		equal( el.volume, 0.5, "Volume should initialize at 0.5");

	});
	
	test("volume: popcorn -> el", function() {
		popc.volume( 0.1 );
		equal( el.volume, 0.1, "Element volume" );
	});

	test("volume: flowplayer -> el", function() {
		flowp.setVolume( 75 );
		equal( el.volume, 0.75, "Element volume" );
	});

	asyncTest("volume: el -> popcorn, flowplayer", function() {
		el.volume = 0.6;
		setTimeout(function() {
			equal( popc.volume(), 0.6, "Popcorn volume" );
			equal( flowp.getVolume(), 60, "FlowPlayer volume" );
			start();
		}, 700);
	});

	test("mute: popcorn -> el", function() {
		popc.mute();
		equal( el.muted, true, "Element muted" );
	});

	test("mute: flowplayer -> el, popcorn", function() {
		flowp.mute();
		equal( el.muted, true, "Element muted" );
	});

	test("currentTime: popcorn -> el", function() {
		popc.currentTime( 1 );
		equal( el.currentTime, 1, "Element current time" );
	});

	asyncTest("currentTime: flowplayer -> el", function() {
		equal( el.currentTime, 0, "Element current time" );
		flowp.seek( 1 );
		setTimeout(function() {		
			notEqual( el.currentTime, 0, "Element current time" );
			start();
		}, 700);
	});

	asyncTest("currentTime: el -> popcorn", function() {
		equal( popc.currentTime(), 0, "Popcorn current time" );
		el.currentTime = 1;
		setTimeout(function() {
			notEqual( popc.currentTime(), 0, "Popcorn current time" );
			start();
		}, 700);			
	});

}
