test( "Popcorn freebase Plugin", function() {

    var popped = Popcorn( "#video" ),
        expects = 12,
        count = 0,
        target = document.getElementById( "freebasediv" );

    expect( expects );

    function plus() {
        if ( ++count === expects ) {
            start();
        }
    }

    stop();

    ok( "freebase" in popped, "freebase is a method of the popped instance" );
    plus();

    equals( target.innerHTML, "", "initially, there is nothing in the target div" );
    plus();

    popped.freebase({
        start: 1,
        end: 6,
        topic:"maize",
        target:"freebasediv",
        template: [{name:"testTemplate"}]
    });
    popped.freebase({
        start: 8,
        end: 12,
        topic: "freebase",
        lang : "",
        target:"freebasediv",
        template: [{name:"testTemplate"}]
    });

    popped.volume(0).play();

    popped.exec( 3, function() {
        notEqual( target.innerHTML, "", "target now contains information" );
        plus();
        equals( target.childElementCount, 2, "target now contains two child elements" );
        plus();
        notEqual( target.children[ 0 ].innerHTML, "", "target has a title" );
        plus();
        notEqual( target.children[ 1 ].innerHTML, "", "target has some content" );
        plus();
    });

    popped.exec( 6, function() {
        equals( target.innerHTML, "", "target was cleared properly" );
        plus();
    });

    popped.exec( 9, function() {
        notEqual( target.innerHTML, "", "target now contains information" );
        plus();
        equals( target.childElementCount, 2, "target now contains two child elements" );
        plus();
        notEqual( target.children[ 1 ].innerHTML, "", "target has the right content" );
        plus();
    });

    popped.exec( 12, function() {
        popped.pause().removeTrackEvent( popped.data.trackEvents.byStart[ 4 ]._id );
        equals( target.innerHTML, "", "target is now empty" );
        plus();
    });

    // empty track events should be safe
    popped.freebase({});

    // debug should log errors on empty track events
    Popcorn.plugin.debug = true;
    try {
        popped.freebase({});
    } catch( e ) {
        ok( true, "empty event was caught by debug" );
        plus();
    }
});
