/*!
 * Will.js JavaScript Library v1.0beta
 * http://github.com/kawamanza/will.js
 *
 * Copyright 2011, Marcelo Manzan
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Tue Nov 22 16:06:48 2011 -0200
 */
(function (window, undefined) {
    "use strict";
    var will = {}, basicApi = {},
        scriptIdData = "data-willjs-id",
        slice = Array.prototype.slice,
        toString = Object.prototype.toString,
        loadComponentLoaded = false,
        loadComponentMethodName = "loadComponent",
        document = window.document;
    window.will = will;
    function isString(value) {
        return typeof value === "string";
    }
    function isArray(value) {
        return toString.call(value) === "[object Array]"
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
            if (isntObject(v) || isArray(v)) {
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
        return this;
    }
    function libIdOf(src) {
        var sid = undefined, seg;
        if (isString(src)) {
            if ( /^([\w\-\.]+)\@(.+)$/.test(src) ) {
                sid = [RegExp.$1, RegExp.$2];
            } else {
                seg = src.split(/[\?#]/)[0].split(/\//);
                seg = seg[seg.length -1];
                sid = [
                    /^([\w\-\.]+?)(?:\.min|\-\d+(?:\.\d+)*(?:\w+)?)*\.js$/.test(seg)
                        ? RegExp.$1
                        : seg,
                    src
                ];
            }
        } else {
            sid = [src.getAttribute(scriptIdData), src.src];
            if (! sid[0]) sid = libIdOf(sid[1]);
        }
        return sid;
    }
    function isLoaded(src) {
        var scripts = document.getElementsByTagName("script"),
            sid = libIdOf(src)[0], i, len = scripts.length;
        for (i = 0; i < len; ) {
            if (libIdOf(scripts[i++])[0] === sid) {
                return true;
            }
        }
        return false;
    }
    function loadLib(src, completeCallback) {
        var head = document.getElementsByTagName("head")[0] || document.documentElement,
            script = document.createElement("script"), done = false, sid = libIdOf(src);
        script.setAttribute(scriptIdData, sid[0]);
        script.src = sid[1];
        script.onload = script.onreadystatechange = function () {
            var rs = this.readyState;
            if (!done && (!rs || rs === "loaded" || rs === "complete")) {
               done = true;
               completeCallback("success");
               script.onload = script.onreadystatechange = undefined;
               script.onerror = script.onabort = undefined;
           }
        };
        script.onerror = script.onabort = function () {
            done = true;
            completeCallback("error");
            script.onload = script.onreadystatechange = undefined;
            script.onerror = script.onabort = undefined;
            if (head && script.parentNode) {
                head.removeChild(script);
            }
        };
        head.appendChild(script);
    }
    function loadComponent_jQuery(context, url, completeCallback) {
        window.jQuery.ajax({
            dataType: "html",
            complete: function (xhr, status) {
                completeCallback(xhr.status, xhr.responseText);
            },
            cache: (context.cfg.mode === will.modes.PROD),
            url: url
        });
    }
    function newProcessor(func) {
        return {
            queue: [],
            active: false,
            run: func,
            sched: function () {
                var self = this;
                setTimeout(function () {self.process();}, 2);
            },
            process: function (args) {
                var self = this,
                    queue = self.queue;
                if (arguments.length) {
                    if (isntObject(args) || !isArray(args)) args = [args];
                    queue.push(args);
                    setTimeout(function () {
                        if (queue.length && !self.active) {
                            self.active = true;
                            self.process();
                        }
                    }, 5);
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
                url = urlFor(context, path),
                entry = entryOf(registry, path),
                impl = entry.impl;
            if (impl) {
                impl.apply(undefined, args);
                return;
            }
            if (path.format == "js") {
                url = path.toString().replace(/[:\.]/g, "_") + "@" + url;
                requireLibs(context, [url])(function (status) {
                    try {
                        if (status == "success") {
                            impl = entry.impl;
                            if (impl) impl.apply(undefined, args);
                        }
                    } finally {
                        self.sched();
                    }
                });
            } else {
                will.u[loadComponentMethodName](context, url, function (statusCode, data) {
                    try {
                        if (statusCode !== 200) {
                            throw "could not load component: " + path;
                        }
                        data = eval("("+data+")");
                        if (isntObject(data)) return;
                        registerFunctions(context, registry, data, path);
                        impl = entry.impl;
                        if (impl) impl.apply(undefined, args);
                    } finally {
                        self.sched();
                    }
                });
            }
            return false;
        });
        processors.loadDependenciesAndCall = newProcessor(function (entry, args) {
            var self = this,
                libs = entry.libs, lib;
            if (libs.length) {
                lib = libs[0];
                if (isLoaded(lib)) {
                    libs.shift();
                    entry.impl.apply(undefined, args);
                } else {
                    loadLib(lib, function (status) {
                        try {
                            if (status === "success") {
                                libs.shift();
                                entry.impl.apply(undefined, args);
                            } else {
                                entry.rescue.apply(undefined, args);
                            }
                        } finally {
                            self.sched();
                        }
                    });
                    return false;
                }
            } else {
                entry.impl.apply(undefined, args);
            }
        });
    }
    function setup(context, reset, initConfig) {
        if (reset || ! ("cfg" in context)) {
            extend.call(context, "cfg", context.api.getConfig());
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
        return p[f] || (p[f] = {rescue: function () {/*delete p[f];*/}});
    }
    function implWrapper(context, entry, f) {
        var func = function () {return f.apply(context, arguments);};
        return function () {
            var args = arguments;
            if (entry.libs.length) {
                process(context, "loadDependenciesAndCall", [entry, args]);
            } else {
                entry.impl = func;
                return f.apply(context, args);
            }
        };
    }
    function registerFunctions(context, registry, funcs, path) {
        if (isntObject(funcs)) return;
        var entry,
            f = funcs.impl || isFunction(funcs.getImpl) && funcs.getImpl(context),
            l = funcs.libs;
        if (isFunction(f)) {
            entry = entryOf(registry, path);
            entry.libs = isntObject(l) || !isArray(l) ? [] : l;
            entry.impl = implWrapper(context, entry, f);
            entry.rescue = funcs.rescue || entry.rescue;
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
            packageName = cfg.defaultPackage,
            func = funcPath.toString();
        if ( /^(?:(\w+):)?(?:(\w+)\.)?(\w+)$/.test(func) ){
            func = RegExp.$3;
            packageName = RegExp.$2 || cfg.packages[func] || packageName;
            domainName = RegExp.$1 || domainName;
        }
        if (!d[domainName]) domainName = "local"
        return {
            format: d[domainName][0],
            domain: d[domainName][1],
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
            + "." + path.format;
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
            if (impl) return impl.apply(undefined, args);
            process(context, "callComponent", [context, path, args]);
        };
    }
    function requireLibs(context, libs) {
        var entry = {libs: libs};
        return function (loadCallback) {
            if (entry.impl) return;
            var func, rescue;
            if (isFunction(loadCallback)) {
                func = function () {loadCallback("success");};
                rescue = function () {loadCallback("error");};
            } else {
                func = rescue = function () {};
            }
            entry.impl = implWrapper(context, entry, func);
            entry.rescue = rescue;
            entry.impl();
        };
    }

    // The Public API
    extend.call(basicApi, {
        "call": function (selector) {
            return stubsTo(this, selector);
        },
        "use": function () {
            return requireLibs(this, slice.call(arguments, 0));
        },
        "addComponent": function (selector, json) {
            var context = this;
            return registerFunctions(context, context.registry, json, pathFor(context, selector));
        },
        "addProcessor": function (processorName, func) {
            var r = this.cfg.processors, p = r[processorName];
            if (!p) this.cfg.processors[processorName] = newProcessor(func);
        },
        "process": function (processorName) {
            process(this, processorName, slice.call(arguments, 1));
        },
        "modes": {DEV:0, PROD:1},
        "api.extend": extend,
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

    basicApi.u[loadComponentMethodName] = function (context, url, completeCallback) {
        if (loadComponentLoaded) {
            completeCallback(500, "");
            return;
        }
        context.use(
            "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"
        )(function (status) {
            if (status === "success") {
                basicApi.u[loadComponentMethodName] = loadComponent_jQuery;
                loadComponent_jQuery(context, url, completeCallback);
            } else {
                loadComponentLoaded = true;
                completeCallback(500, "");
            }
        });
    };

    // Settings
    basicApi.api.extend({
        "getConfig": function () {
            return extend.call(new this.Defaults(), {
                "processors": {},
                "domains": {
                    "local": ["json", "/javascripts/will/"]
                },
                "packages": {}
            });
        },
        "Defaults": function () {}
    });
    extend.call(basicApi.api.Defaults.prototype, {
        "mode": will.modes.DEV,
        "addDomain": function (domainName, urlPrefix, asJS) {
            this.domains[domainName] = [(asJS ? "js" : "json"), urlPrefix + (/\/$/.test(urlPrefix) ? "" : "/")];
        },
        "defaultPackage": "root",
        "registerPackage": function (packageName, functions) {
            var funcs = functions.split(/,/), p, len, i;
            p = this.packages;
            for (i = 0, len = funcs.length; i < len; ) {
                p[funcs[i++]] = packageName;
            }
        }
    });

    // Initial setup
    setup(will, false);
})(window, null);
