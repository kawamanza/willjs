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
    function loadLib(url, completeCallback) {
        var head = document.getElementsByTagName("head")[0] || document.documentElement,
            script = document.createElement("script"), done = false;
        script.src = url;
        script.onload = script.onreadystatechange = function () {
            var rs = this.readyState;
            if (!done && (!rs || rs === "loaded" || rs === "complete")) {
               done = true;
               completeCallback("success");
               script.onload = script.onreadystatechange = null;
               script.onerror = script.onabort = null;
           }
        };
        script.onerror = script.onabort = function () {
            done = true;
            completeCallback("error");
            script.onload = script.onreadystatechange = null;
            script.onerror = script.onabort = null;
            if (head && script.parentNode) {
                head.removeChild(script);
            }
        };
        head.appendChild(script);
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
        processors.callComponent = newProcessor(function (context, path, args) {
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
            will.u.loadComponent(urlFor(context, path), function (statusCode, data) {
                try {
                    if (statusCode !== 200) {
                        throw "could not load component: " + path;
                    }
                    data = eval("("+data+")");
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
        processors.loadDependenciesAndCall = newProcessor(function (entry, args) {
            var self = this,
                libs = entry.libs, lib;
            if (libs.length) {
                lib = libs[0];
                loadLib(lib, function (status) {
                    try {
                        if (status === "success") {
                            libs.shift();
                            entry.impl.apply(entry, args);
                        }
                    } finally {
                        self.sched();
                    }
                });
                return false;
            } else {
                entry.impl.apply(entry, args);
            }
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
    function implWrapper(context, entry, f) {
        var func = function () {return f.apply(context, arguments);};
        return entry.libs.length ? function () {
            var args = arguments;
            if (entry.libs.length) {
                process(context, "loadDependenciesAndCall", [entry, args]);
            } else {
                entry.impl = func;
                return f.apply(context, args);
            }
        } : func;
    }
    function registerFunctions(context, registry, funcs, path) {
        if (isntObject(funcs)) return;
        var entry,
            f = funcs.impl || isFunction(funcs.getImpl) && funcs.getImpl(context),
            l = funcs.libs;
        if (isFunction(f)) {
            entry = entryOf(registry, path);
            entry.libs = isntObject(l) || l.constructor.name !== "Array" ? [] : l;
            entry.impl = implWrapper(context, entry, f);
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
            domainName = "local",
            domain = d[domainName],
            packageName = cfg.defaultPackage,
            func = funcPath;
        if ( /^(?:(\w+):)?(?:(\w+)\.)?(\w+)$/.test(funcPath) ){
            func = RegExp.$3;
            packageName = RegExp.$2 || cfg.packages[func] || packageName;
            domainName = RegExp.$1 || domainName;
            domain = d[domainName];
            if (! domain) {
                domainName = "local";
                domain = d[domainName];
            }
        }
        return {
            domain: domain,
            packageName: packageName,
            func: func,
            toString: function() {
                return domainName + ":" + packageName + "." + func;
            }
        };
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
                args = arguments,
                path = pathFor(context, funcPath),
                entry = entryOf(registry, path),
                impl = entry.impl;
            if (impl) return impl.apply(context, args);
            process(context, "callComponent", [context, path, args]);
        };
    }

    // The Public API
    extend.call(basicApi, {
        "call": function (selector) {
            return stubsTo(this, selector);
        },
        "process": function (handlerName) {
            process(this, handlerName, Array.prototype.slice.call(arguments, 1));
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
(function (document, $) {
    "use strict";
    if (! $) return;
    will.u.extend({
        "loadComponent": function (url, completeCallback) {
            $.ajax({
                dataType: "html",
                complete: function (xhr, status) {
                    completeCallback(xhr.status, xhr.responseText);
                },
                cache: false,
                url: url
            });
        }
    });
})(window.document, window.jQuery);
