# WillJS

A simple way to invoke on-demand behaviors into your website pages.

## Public API

```javascript
will.call("componentName")(param1, param2);            // invokes a component
will.use("/jquery.js", "/jquery-ui.js")();             // loads required assets if not present yet.
```

## Demo Page

See the [demo page](http://kawamanza.github.io/willjs/demo/).

### Site structure

```
www-root/
 +- css/
 |  +- base.css
 |  `- bootstrap.min.css
 +- js/
 |  +- libs/
 |  |  +- bootstrap.min.css
 |  |  +- handlebars.js
 |  |  `- jquery-1.8.1.min.js
 |  `- will/
 |     +- components/
 |     |  +- jqueryui/
 |     |  |  `- slider.js [2]
 |     |  +- modal.js [4]
 |     |  `- popMessage.js [3]
 |     +- config.js [1]
 |     `- will.min.js
 `- index.html
```

Links

1. [www-root/js/will/config.js](http://kawamanza.github.io/willjs/demo/js/will/config.js)
2. [www-root/js/will/components/jqueryui/slider.js](http://kawamanza.github.io/willjs/demo/js/will/components/jqueryui/slider.js)
3. [www-root/js/will/components/popMessage.js](http://kawamanza.github.io/willjs/demo/js/will/components/popMessage.js)
4. [www-root/js/will/components/modal.js](http://kawamanza.github.io/willjs/demo/js/will/components/modal.js)

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
