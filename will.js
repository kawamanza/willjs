(function (window, undefined) {
    "use strict";
    var will = {}, basicApi = {};
    window.will = will;
    function fill(root, keys, value) {
        var key, v;
        if (typeof keys == 'string') {
            keys = keys.split(/\./);
        }
        key = keys.shift();
        if (keys.length == 0) {
            root[key] = value;
        } else {
            v = root[key];
            if (typeof v != "object" || v.constructor.name == "Array") {
                v = {};
                root[key] = v;
            }
            fill(v, keys, value);
        }
    }
    function extend(hash) {
        var key = "", k;
        if (typeof hash == "string") {
            key = hash + ".";
            hash = arguments[1];
        }
        for (k in hash) {
            fill(this, key + k, hash[k]);
        }
    }
    function defaultConfig() {
        return {
            "mode": will.modes.DEV,
            "domains": {
                "local": "/javascripts/will-functions/"
            },
            "addDomain": function (domainName, urlPrefix) {
                if (! /\/$/.test(urlPrefix)) urlPrefix += "/"
                this.domains[domainName] = urlPrefix;
            },
            "packages": {},
            "defaultPackage": "defaultFunctions",
            "registerPackage": function (packageName, functions) {
                var funcs = functions.split(/,/), p, func, len, i;
                p = this.packages;
                for (i = 0, len = funcs.length; i < len; i++) {
                    func = funcs[i];
                    p[func] = packageName;
                }
            }
        };
    }
    function setup(context, reset, initConfig) {
        if (reset || ! ("cfg" in context)) {
            extend.call(context, "cfg", defaultConfig());
            context.registry = {};
            if (! ("call" in context)) extend.call(context, basicApi);
        }
        if (typeof initConfig == "function") initConfig(context.cfg);
    }
    function registerFunctions(registry, funcs, func) {
        var f = funcs.impl || funcs.getImpl && funcs.getImpl();
        if (typeof funcs != "object") {
            return;
        }
        else if (typeof f == "function") {
            var entry = registry[func];
            if (! entry) {
                entry = registry[func] = {
                    queue: []
                };
            }
            entry.impl = f;
        } else {
            for(func in funcs) {
                registerFunctions(registry, funcs[func], func);
            }
        }
    }
    function stubsTo(context, func) {
        var d = context.cfg.domains,
            domain = "local", packageName = context.cfg.defaultPackage;
        if ( /^(?:(\w+):)?(?:(\w+)\.)?(\w+)$/.test(func) ){
            domain = RegExp.$1 || domain;
            packageName = RegExp.$2 || packageName;
            func = RegExp.$3;
        }
        domain = d[domain] || d.local;
        return function () {
            var r = context.registry, entry = r[func], url;
            if (! entry) {
                entry = r[func] = {
                    queue: []
                };
            }
            if (entry.impl) {
              entry.impl.apply(context, arguments);
            } else {
                entry.queue.push(arguments);
                url = domain;
                if (context.cfg.mode == will.modes.PROD) {
                    url += packageName;
                } else {
                    if ( packageName == context.cfg.defaultPackage) {
                        url += func;
                    } else {
                        url += packageName + "/" + func;
                    }
                }
                will.u.loadComponent(url + ".json",
                    function (data) {
                        if (typeof data == "string") {
                            try{data = eval("("+data+")");}catch(e){return;}
                        }
                        if (typeof data != "object") return;
                        registerFunctions(r, data, func);
                        entry = r[func];
                        while (entry.queue.length) {
                            entry.impl.apply(context, entry.queue.shift());
                        }
                    });
            }
        };
    }

    // The Public API
    extend.call(basicApi, {
        "call": function (selector) {
            return stubsTo(this, selector);
        },
        "modes": {DEV:0, PROD:1},
        "u.extend": extend
    });
    extend.call(will, {
        "configure": function (initConfig) {
            setup(this, false, initConfig);
            return this;
        },
        "reconfigure": function (initConfig) {
            setup(this, true, initConfig);
            return this;
        }
    });
    extend.call(will, basicApi);
    setup(will, false);
})(window);

// will-jquery_adapter
(function ($) {
    "use strict";
    if (! $) return;
    will.u.extend({
        "loadComponent": function (url, successCallback) {
            $.ajax({
                dataType: "html",
                success: successCallback,
                url: url
            });
        }
    });
})(window.jQuery);
