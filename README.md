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
            "/javascripts/will/");                         // default component domain (repository)
        config.defaultPackage = "root";                    // default package
    });

## Components

    // {host}/javascripts/will/doSomething.json
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

    will.call("doSomething")();                                // /javascripts/will/doSomething.json
    will.call("local:root.doSomething")();                     // same as above
    will.call("mypack.doSomething")();                         // /javascripts/will/mypack/doSomething.json
    will.call("local:mypack.doSomething")();                   // same as above

### PROD mode

In this mode, the components are fetched by your package location. Example:

    will.call("doSomething")();                                // /javascripts/will/root.json
    will.call("local:root.doSomething")();                     // same as above
    will.call("mypack.doSomething")();                         // /javascripts/will/mypack.json
    will.call("local:mypack.doSomething")();                   // same as above

When grouping components inside a package, the JSON components file must be like below:

    // {host}/javascripts/will/root.json
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

## Sequential Processors

    var shouldWaitForCallback = true;                          // just for this example
    will.unstackWith("processorName", function (param1, param2) {
        var processor = this;
        if (shouldWaitForCallback) {                           // do something async?
            doSomethingAsynchronously(function () {
                try {
                    // something you plan to do
                } finally {
                    processor.sched();                         // do not forget this
                }
            });
            return false;                                      // let the schedule with me
        } else {
            // something you want to do synchronously
            // (you must return something other than false)
        }
    });
    will.stackUp("processorName", param1, param2);             // do this job after all, please

## Customized Will.js

    window.myWill = {};
    will.configure.call(window.myWill, function (config) {
        config.mode = will.modes.DEV;                      // default mode
        config.addDomain(
            "local",                                       // default domain
            "/javascripts/will/");                         // default component domain (repository)
        config.defaultPackage = "root";                    // default package
    });
    // Public API
    myWill.call("componentName")(param1, param2);         // invokes a component
    myWill.use("/jquery.js", "/jquery-ui.js")();          // loads required libs if not present yet.

Enjoy in moderation!
