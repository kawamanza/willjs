# Will.js

    A simple way to invoke on-demand behaviors into your website pages.

## Public API

    will.call("componentName")(param1, param2);            // invokes a component
    will.use("/jquery.js", "/jquery-ui.js")();             // loads required assets if not present yet.

## Configuration

    will.configure(function (config) {
        config.mode = will.modes.DEV;                      // default mode
        config.queryString = "_=useThisForCaching";

        config.addDomain(
            "local",                                       // default domain name
            "/javascripts/will/",                          // default repository path
            false);                                        // load by ajax (json/jsonp, default)

        config.addDomain(
            "remote",                                      // customized domain name
            "/javascripts/will-scripts/",                  // components repository path
            true,                                          // load as script (js)
            will.modes.PROD);                              // mode (optional, null: use default)

        config.defaultPackage = "root";                    // default package
    });

## Components

A WillJS component is a simple implementation to perform an action to the user.
The components (and they dependencies) are loaded just when they are called for the
first time. This allows you to do on-demand loading of assets (js/css) for your webpage
only when the user accesses the resource.

The structure of a component is a JSON with a little set of attributes. Example:

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
        rescue: function () {/* fallback */},              // error loading assets
        assets: [                                          // required assets (optional)
            "/javascripts/lib1.js",
            "/javascripts/lib2.js"
        ]
    }

  - The *impl* attribute is the main function that will perform the operation asynchronously.
  - The *getImpl* attribute is optional, and allow you to have a context to create some
    global variables or private functions that will be used into your *impl* function.
    The *getImpl* function must return another function that will be the main function
    of the component. The *impl* attribute must not be present in this case.
  - The *rescue* attribute is a function that will be invoked when some dependency could
    not be loaded.
  - The *assets* attribute is a list of CSSs and/or JSs to be loaded before performs the
    component's function for the first time.

The components are loaded by AJAX and stored on WillJS's registry. This operation is
triggered when the component is invoked for the first time.

### Adding components directly

If you prefer to load components as script, you need to execute the instruction like below:

    // {host}/javascripts/will/doSomething.js
    will.addComponent("doSomething", {
        // impl: function () {/* the component, or... */}, // optional
        getImpl: function (will) {
            // do something before return the component
            return function (param1, param2) {
                var will = this;
                // do something the user requests to
            };
        },
        rescue: function () {/* fallback */},              // error loading assets
        assets: [                                          // required assets (optional)
            "/javascripts/lib1.js",
            "/javascripts/lib2.js"
        ]
    });

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
            rescue: function () {/* fallback */},              // error loading assets
            assets: [                                          // required assets (optional)
                "/javascripts/lib1.js",
                "/javascripts/lib2.js"
            ]
        },
        otherComponent: { /* and so on... */ }
    }

## Sequential Processors

This feature is available for plugin development and for advanced usage.

    var shouldWaitForCallback = true;                          // just for this example
    will.addProcessor("processorName", function (param1, param2) {
        var processor = this;
        if (shouldWaitForCallback) {                           // do something async?
            doSomethingAsynchronously(function () {
                try {
                    // something you plan to do
                } finally {
                    processor.sched();                         // do the next process on the stack
                }
            });
            return false;                                      // trust me, let me schedule the next process
        } else {
            // something you want to do synchronously
            // (you must return something other than false)
        }
    });
    will.process("processorName", param1, param2);             // schedule this job after all

## Customized Will.js

You may have other instances of WillJS if you want.

    will.as("myWill").configure(function (config) {
        config.mode = will.modes.DEV;                      // default mode
        config.addDomain(
            "local",                                       // default domain name
            "/javascripts/will/");                         // default repository path
        config.defaultPackage = "root";                    // default package
    });
    // Public API
    myWill.call("componentName")(param1, param2);         // invokes a component
    myWill.use("/jquery.js", "/jquery-ui.js")();          // loads required assets if not present yet.

Enjoy in moderation!
