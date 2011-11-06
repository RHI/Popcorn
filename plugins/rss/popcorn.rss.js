// PLUGIN: RSS

(function ( Popcorn ) {
  
  /**
   * RSS popcorn plug-in 
   * Uses jgfeed library to fetch any RSS feed. jQuery templates are passed in to render the results.
   *
   * 
   * Example:
     var p = Popcorn("#video")
        .rss({
          start: 5, // seconds
          end: 15, // seconds
          rss-url: "[url to feed]",
          target: "my_div_id"
        } )
   *
   */
   
   
  Popcorn.plugin( "rss" , {
      
    manifest: {
      about:{
        name: "Popcorn RSS Plugin",
        version: "0.1",
        author: "@kyledmorton",
        website: "www.ramp.com"
      },
      options:{
        start: {
          elem: "input", 
          type: "text", 
          label: "In"
        },
        end: {
          elem: "input", 
          type: "text", 
          label: "Out"
        },
        url: {
          elem: "input", 
          type: "text", 
          label: "rss feed url"
        },
        lang: {
          elem: "input", 
          type: "text", 
          label: "Language"
        },
        template: {
          elem: "input", 
          type: "array", 
          label: "Array of jQuery templates"
        },
        target: "rss-container",
        debug: false
      }
    },
    
    supportsExperienceManager: true,
    _data: {},

    _setup : function( options ) {
        if (options.debug) {
            console.log("popcorn.rss._setup")
            console.log(options)
        }
        
        //if a template is used then load template prerequisites
        if (options.template) { 
            Popcorn.getScript("http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js");
            Popcorn.getScript("http://ajax.microsoft.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js");
            Popcorn.getScript("jquery.jgfeed-min.js");
        }
    
      // declare needed variables
      // get a guid to use for the global freebasecallback function
      var  _text, _guid = Popcorn.guid(); 
      
      //make sure the topic is formatted properly
	options._topic = options.topic;
      options.topic =  String(options.topic.split(' ').join('_')).toLowerCase();

      
      //preload
	this._data = new Array();
        var _out = this;

	var gfeed_url = this.options.url";

        $.jGFeed( encodeURIComponent(gfeed_url),
          function(feeds){
            if(!feeds){
              return false;
            }
	    _out._data["rss"]=entries;
          }, 100);    

    },

    start: function( event, options ){
      // dont do anything if the information didn't come back
      var isReady = function () {
        
        if ( !options._fired ) {
          setTimeout( function () {
            isReady();
          }, 13);
        } else {
      
            if (options.template) {
                    for (var i=0; i < options.template.length; i++) {
                        var t = options.template[i];
                        t.data = options._result;
                                            
                        if (t.prop) {
                            var props = options._result.properties[t.prop].values;
                            t.props = props;                    
                        }
                        
                        $( "#"+ t.name ).tmpl( t ).appendTo( $("#" + options.target) );                        
                    }
            }
            

        }
      };
      
      isReady();
    },

    end: function( event, options ){
    },

    _teardown: function( options ){

    }
  });

})( Popcorn );

