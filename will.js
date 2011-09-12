(function (window, undefined) {
    "use strict";
    var will = {}, basicApi = {};
    window.will = will;
    function isString(value) {
        return typeof value === "string";
    }
    function isntObject(value) {
        return typeof value !== "object";
    }
    function isFunction(value) {
        return typeof value === "function";
    }
    function fill(root, keys, value) {
        var key, v;
        if (isString(keys)) {
            keys = keys.split(/\./);
        }
        key = keys.shift();
        if (keys.length == 0) {
            root[key] = value;
        } else {
            v = root[key];
            if (isntObject(v) || v.constructor.name == "Array") {
                v = {};
                root[key] = v;
            }
            fill(v, keys, value);
        }
    }
    function extend(hash, other) {
        var key = "", k;
        if (isString(hash)) {
            key = hash + ".";
            hash = other;
        }
        for (k in hash) {
            fill(this, key + k, hash[k]);
        }
    }
    function defaultConfig() {
        return {
            "mode": will.modes.DEV,
            "processors": {},
            "domains": {
                "local": "/javascripts/will-functions/"
            },
            "addDomain": function (domainName, urlPrefix) {
                this.domains[domainName] = urlPrefix + (/\/$/.test(urlPrefix) ? "/" : "");
            },
            "packages": {},
            "defaultPackage": "root",
            "registerPackage": function (packageName, functions) {
                var funcs = functions.split(/,/), p, len, i;
                p = this.packages;
                for (i = 0, len = funcs.length; i < len; ) {
                    p[funcs[i++]] = packageName;
                }
            }
        };
    }
    function newProcessor(func) {
        return {
            queue: [],
            active: false,
            run: func,
            sched: function () {
                var self = this;
                setTimeout(function () {self.process();}, 10);
            },
            process: function (args) {
                var self = this,
                    queue = self.queue;
                if (arguments.length) {
                    if (isntObject(args) || args.constructor.name != "Array") args = [args];
                    queue.push(args);
                    setTimeout(function () {
                        if (queue.length && !self.active) {
                            self.active = true;
                            self.process();
                        }
                    }, 20);
                } else {
                    if (queue.length) {
                        args = queue.shift();
                        try {
                            if (self.run.apply(self, args) !== false){
                                self.sched();
                            }
                        } catch (e) {
                            self.sched();
                            throw e;
                        }
                    } else {
                        self.active = false;
                    }
                }
            }
        };
    }
    function addDefaultProcessors(processors) {
        processors.callComponent = newProcessor(function(context, path, args) {
            var self = this,
                registry = context.registry,
                entry = entryOf(registry, path),
                queue = entry.queue,
                impl = entry.impl;
            if (impl) {
                impl.apply(context, arguments);
                return;
            }
            queue.push(args);
            will.u.loadComponent(urlFor(context, path), function (data) {
                try {
                    if (isString(data)) {
                        try{data = eval("("+data+")");}catch(e){return;}
                    }
                    if (isntObject(data)) return;
                    registerFunctions(context, registry, data, path);
                    impl = entry.impl;
                    while (queue.length) {
                        impl.apply(context, queue.shift());
                    }
                } finally {
                    self.sched();
                }
            });
            return false;
        });
    }
    function setup(context, reset, initConfig) {
        if (reset || ! ("cfg" in context)) {
            extend.call(context, "cfg", defaultConfig());
            context.registry = {};
            addDefaultProcessors(context.cfg.processors);
            if (! ("call" in context)) extend.call(context, basicApi);
        }
        if (isFunction(initConfig)) initConfig(context.cfg);
    }
    function entryOf(registry, path) {
        var pn = path.packageName,
            p = registry[pn] || (registry[pn] = {}),
            f = path.func;
        return p[f] || (p[f] = {queue:[]});
    }
    function registerFunctions(context, registry, funcs, path) {
        if (isntObject(funcs)) return;
        var entry,
            g = funcs.getImpl,
            f = funcs.impl || g && g(context);
        if (isFunction(f)) {
            entry = entryOf(registry, path);
            entry.impl = f;
        } else {
            for(f in funcs) {
                path.func = f;
                registerFunctions(context, registry, funcs[f], path);
            }
        }
    }
    function pathFor(context, funcPath) {
        var cfg = context.cfg,
            d = cfg.domains,
            domain = d.local,
            packageName = cfg.defaultPackage,
            func = funcPath;
        if ( /^(?:(\w+):)?(?:(\w+)\.)?(\w+)$/.test(funcPath) ){
            func = RegExp.$3;
            packageName = RegExp.$2 || cfg.packages[func] || packageName;
            domain = d[RegExp.$1 || "local"] || domain;
        }
        return {domain: domain, packageName: packageName, func: func};
    }
    function urlFor(context, path) {
        var cfg = context.cfg,
            pn = path.packageName, f = path.func;
        return path.domain
            + (cfg.mode == will.modes.PROD
                ? pn
                : pn == cfg.defaultPackage
                    ? f
                    : pn + "/" + f)
            + ".json";
    }
    function process(context, handler, args) {
        var r = context.cfg.processors,
            p = r[handler];
        if (!p) {
            p = r[handler] = newProcessor(function(f) {if (isFunction(f)) f();});
        }
        p.process(args);
    }
    function stubsTo(context, funcPath) {
        return function () {
            var registry = context.registry,
                path = pathFor(context, funcPath),
                entry = entryOf(registry, path),
                queue = entry.queue, impl = entry.impl;
            if (impl) return impl.apply(context, arguments);
            context.process("callComponent", [context, path, arguments]);
        };
    }

    // The Public API
    extend.call(basicApi, {
        "call": function (selector) {
            return stubsTo(this, selector);
        },
        "process": function (handler, args) {
            process(this, handler, args);
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
