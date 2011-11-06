// PLUGIN: FREEBASE

(function ( Popcorn ) {

    /**
     * Freebase popcorn plug-in
     * https://github.com/RHI/Popcorn
     *
     * Displays topic title, description and thumbnail
     * uses experimental JSON interface from Freebase and JSONP jQuery implementation
     * http://www.freebase.com/experimental/topic/standard/[LANG]/[TOPIC]
     *
     * The plugin is based on the wikipedia plugin example
     *
     * Example:
     var p = Popcorn("#video")
     .freebase({
     start:2,
     end:8,
     target:"freebasediv",
     topic:"maize",
     template: [{name:"myTemplate"}]
     });


     Where the page already contains the template:
     <script id="myTemplate" type="text/x-jquery-tmpl">
     <div class="freebase">
     <div><img src="${data.thumbnail}"/></div>
     <div>${data.text}</div>
     <p>${data.description}</p>
     </div>
     </script>

     See: http://api.jquery.com/category/plugins/templates/ for more info on jQuery templates.
     */


    Popcorn.plugin( "freebase" , {

        manifest: {
            about:{
                name: "Popcorn Freebase Plugin",
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
                topic: {
                    elem: "input",
                    type: "text",
                    label: "freebase topic key"
                },
                lang: {
                    elem: "input",
                    type: "text",
                    label: "Language"
                },
                callback: {
                    elem: "input",
                    type: "function",
                    label: "handles results"
                },
                template: {
                    elem: "input",
                    type: "text",
                    label: "jQuery template object"
                },
                target: "freebase-container",
                debug: false
            }
        },

        supportsExperienceManager: true,
        _data: {},

        _setup : function( options ) {
            if (options.debug) {
                console.log("popcorn.freebase._setup");
                console.log(options)
            }

            //if a template is used then load template prerequisites
            if (options.template) {
                Popcorn.getScript("http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js");
                Popcorn.getScript("http://ajax.microsoft.com/ajax/jquery.templates/beta1/jquery.tmpl.min.js");
            }


            // declare needed variables
            // get a guid to use for the global freebasecallback function
            var  _text, _guid = Popcorn.guid();

            // if the user didn't specify a language default to english
            if ( options.lang == null) {
                options.lang = "en";
            }

            //make sure the topic is formatted properly
            options.topic =  String(options.topic.split(' ').join('_')).toLowerCase();

            //preload
            var service_url = "http://www.freebase.com/experimental/topic/standard" + "/"
                + ( options.lang ? options.lang + "/" : '')
                + options.topic;

            if (options.debug)
                console.log("popcorn.freebase.service_url = " + service_url);

            Popcorn.getJSONP(service_url + "?callback=jsonp", function(response) {
                var result = response.result;
                options._result = response.result;
                options._fired = true;
            });
        },

        start: function( event, options ){
            // dont do anything if the information didn't come back from freebase
            var isReady = function () {

                if ( !options._fired ) {
                    setTimeout( function () {
                        isReady();
                    }, 13);
                } else {
                    if( ! options._result ){
                        options.debug && console.log("no data available for: " + options.topic);
                        return;
                    }

                    if (options.callback)
                        options.callback({event:"end",topic:options.topic,result:options._result});

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
            if (options.callback)
                options.callback({event:"end",topic:options.topic,result:options._result});

            $("#" + options.target).html("");
        },

        _teardown: function( options ){

        }
    });

})( Popcorn );
