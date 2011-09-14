# Will.js

    A simple way to invoke on-demand behaviors into your website pages.

## Public API

    will.call("componentName")(param1, param2);            // invokes a component
    will.use("/jquery.js", "/jquery-ui.js")();             // loads required libs if not present yet.

## Configuration

    will.configure(function (config) {
        config.mode = will.modes.DEV;                      // default mode
        config.addDomain(
            "local",                                       // default domain
            "/javascripts/will-functions/");               // default component domain (repository)
        config.defaultPackage = "root";                    // default package
    });

## Components

    // {host}/javascripts/will-functions/doSomething.json
    {
        // impl: function () {/* the component, or... */}, // optional
        getImpl: function (will) {
            // do something before return the component
            return function (param1, param2) {
                var will = this;
                // do something the user requests to
            };
        },
        libs: [                                            // required libs (optional)
            "/javascripts/lib1.js",
            "/javascripts/lib2.js"
        ]
    }

## Modes

### DEV mode

In this mode, the components are fetched by your entire path location. Example:

    will.call("doSomething")();                                // /javascripts/will-functions/doSomething.json
    will.call("local:root.doSomething")();                     // same as above
    will.call("mypack.doSomething")();                         // /javascripts/will-functions/mypack/doSomething.json
    will.call("local:mypack.doSomething")();                   // same as above

### PROD mode

In this mode, the components are fetched by your package location. Example:

    will.call("doSomething")();                                // /javascripts/will-functions/root.json
    will.call("local:root.doSomething")();                     // same as above
    will.call("mypack.doSomething")();                         // /javascripts/will-functions/mypack.json
    will.call("local:mypack.doSomething")();                   // same as above

When grouping components inside a package, the JSON components file must be like below:

    // {host}/javascripts/will-functions/root.json
    {
        doSomething: {
            // impl: function () {/* the component, or... */}, // optional
            getImpl: function (will) {
                // do something before return the component
                return function (param1, param2) {
                    var will = this;
                    // do something the user requests to
                };
            },
            libs: [                                            // required libs (optional)
                "/javascripts/lib1.js",
                "/javascripts/lib2.js"
            ]
        },
        otherComponent: { /* and so on... */ }
    }

Enjoy in moderation!
