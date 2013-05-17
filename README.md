# WillJS

A simple way to invoke on-demand behaviors into your website pages.

## Public API

```javascript
will.call("componentName")(param1, param2);            // invokes a component
will.use("/jquery.js", "/jquery-ui.js")();             // loads required assets if not present yet.
```

## Demo Page

See the [demo page](http://kawamanza.github.io/willjs/demo/).

## Configuration

```javascript
will.configure(function (config) {
    config.mode = will.modes.DEV;                      // default mode
    config.queryString = "_=useThisForCaching";

    config.addDomain(
        "local",                                       // default domain
        "/javascripts/will/",                          // default component domain (repository)
        "js");                                         // load as script (js, default)

    config.defaultPackage = "root";                    // default package
});
```

## Components

The components are automatically loaded and stored on WillJS's registry.

```javascript
// {host}/javascripts/will/doSomething.js
will.define(
    "doSomething"       /* Component Name */

  , [                   /* Dependencies, CSSs and JSs */
        "/stylesheets/base1.css"
      , "/javascripts/lib1.js"
      , "/javascripts/lib2.js"
    ]

  , function (will) {   /* Factory */
        // do something before return the component
        return function (param1, param2) {
            var will = this;
            // do something the user requests to
        };
    }
);
```

## Modes

### DEV mode

In this mode, the components are fetched by your entire path location. Example:

```javascript
will.call("doSomething")();                             // /javascripts/will/doSomething.js
will.call("local:root.doSomething")();                  // same as above
will.call("mypack.doSomething")();                      // /javascripts/will/mypack/doSomething.js
will.call("local:mypack.doSomething")();                // same as above
```

### PROD mode

In this mode, the components are fetched by your package location. Example:

```javascript
will.call("doSomething")();                             // /javascripts/will/root.js
will.call("local:root.doSomething")();                  // same as above
will.call("mypack.doSomething")();                      // /javascripts/will/mypack.js
will.call("local:mypack.doSomething")();                // same as above
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
