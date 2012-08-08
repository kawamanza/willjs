# WillJS

A simple way to invoke on-demand behaviors into your website pages.

## Public API

```javascript
will.call("componentName")(param1, param2);            // invokes a component
will.use("/jquery.js", "/jquery-ui.js")();             // loads required assets if not present yet.
```

## Configuration

```javascript
will.configure(function (config) {
    config.mode = will.modes.DEV;                      // default mode
    config.queryString = "_=useThisForCaching";

    config.addDomain(
        "local",                                       // default domain
        "/javascripts/will/",                          // default component domain (repository)
        false);                                        // load by ajax (json/jsonp, default)

    config.addDomain(
        "remote",                                      // another domain sample
        "/javascripts/will-scripts/",                  // components repository
        true,                                          // load as script (js)
        will.modes.PROD);                              // mode (optional, null: use default)

    config.defaultPackage = "root";                    // default package
});
```

## Components

The components are automatically loaded by AJAX and stored on Will's registry.

```javascript
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
        "/stylesheets/base1.css",
        "/javascripts/lib1.js",
        "/javascripts/lib2.js"
    ]
}
```

### Adding components directly

If you prefere to load components as script, you need to perform the instruction below:

```javascript
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
        "/stylesheets/base1.css",
        "/javascripts/lib1.js",
        "/javascripts/lib2.js"
    ]
});
```

## Modes

### DEV mode

In this mode, the components are fetched by your entire path location. Example:

```javascript
will.call("doSomething")();                             // /javascripts/will/doSomething.json
will.call("local:root.doSomething")();                  // same as above
will.call("mypack.doSomething")();                      // /javascripts/will/mypack/doSomething.json
will.call("local:mypack.doSomething")();                // same as above
```

### PROD mode

In this mode, the components are fetched by your package location. Example:

```javascript
will.call("doSomething")();                             // /javascripts/will/root.json
will.call("local:root.doSomething")();                  // same as above
will.call("mypack.doSomething")();                      // /javascripts/will/mypack.json
will.call("local:mypack.doSomething")();                // same as above
```

When grouping components inside a package, the JSON components file must be like below:

```javascript
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
        rescue: function () {/* fallback */},           // error loading assets
        assets: [                                       // required assets (optional)
            "/stylesheets/base1.css",
            "/javascripts/lib1.js",
            "/javascripts/lib2.js"
        ]
    },
    otherComponent: { /* and so on... */ }
}
```

## Customized WillJS

```javascript
will.as("myWill").configure(function (config) {
    config.mode = will.modes.DEV;                       // default mode
    config.defaultPackage = "root";                     // default package
});
// Public API
myWill.call("componentName")(param1, param2);           // invokes a component
myWill.use("/jquery.js", "/jquery-ui.js")();            // loads required assets if not present yet.
```

Enjoy in moderation!
