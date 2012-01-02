/*!
 * WillJS JavaScript Library v1.2
 * http://github.com/kawamanza/will.js
 *
 * Copyright 2011, Marcelo Manzan
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Wed Dec 21 11:14:44 2011 -0200
 */
(function (window, globalName, undefined) {
    "use strict";
    var will, basicApi = {},
        elementIdData = "data-willjs-id",
        SID_PATTERN = /^([\w\-\.]+?)(?:\.min|\-\d+(?:\.\d+)*(?:\w+)?)*\.(?:css|js)$/,
        slice = Array.prototype.slice,
        toString = Object.prototype.toString,
        loadComponentLoaded = false,
        loadComponentMethodName = "loadComponent",
        document = window.document;
    function WillJS(name, prepare) {
        this.name = name;
        if (prepare) setup(this, false);
    }
    window[globalName] = will = new WillJS(globalName);
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
    function isCss(href) {
        return /\.css$/.test(href);
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
    function extend(self, hash, other) {
        var key = "", k, len = arguments.length;
        if (len < 3) {
            other = hash;
            hash = self;
            self = this;
        }
        if (isString(hash)) {
            key = hash + ".";
            hash = other;
        }
        else if (len == 2) {
            self = hash;
            hash = other;
        }
        for (k in hash) {
            fill(self, key + k, hash[k]);
        }
        return self;
    }
    function uncachedAsset(asset) {
        return asset.split(/[\?#]/)[0];
    }
    function tagIdOf(asset) {
        var sid = undefined, seg;
        if (isString(asset)) {
            asset = uncachedAsset(asset);
            if ( /^([\w\-\.]+)\@(.+)$/.test(asset) ) {
                sid = [RegExp.$1, RegExp.$2];
            } else {
                seg = asset.split(/\//);
                seg = seg[seg.length -1];
                sid = [
                    SID_PATTERN.test(seg)
                        ? RegExp.$1
                        : seg,
                    asset
                ];
                if (isCss(sid[1])) {
                    seg = sid[1].split(/\/+/);
                    if (/^\^?(\w+:|)$/.test(seg[0])) seg.shift();
                    seg.pop();
                    seg.push(sid[0]);
                    sid[0] = seg.join("_").replace(/:/, "-");
                }
            }
        } else {
            seg = asset.getAttribute("src") || asset.getAttribute("href");
            sid = [asset.getAttribute(elementIdData), uncachedAsset(seg || "")];
            if (! sid[0] && sid[1]) sid = tagIdOf(sid[1]);
        }
        if (sid.length == 2) {
            sid.push(isCss(sid[1]));
            sid.push(sid[2] ? "link" : "script");
            sid.push(/^\^/.test(sid[1]));
            if (sid[4]) sid[1] = sid[1].substr(1);
        }
        return sid;
    }
    function isLoaded(asset) {
        var sid = tagIdOf(asset), id = sid[0], href = sid[1], css = sid[2],
            elements = document.getElementsByTagName(sid[3]),
            i, len = elements.length, el;
        for (i = 0; i < len; ) {
            el = elements[i++];
            if (tagIdOf(el)[0] === id) {
                if (/\@/.test(asset) && css && el.getAttribute("href") != href) el.setAttribute("href", href);
                return [css, el];
            }
        }
        return false;
    }
    function bindLoadBehaviourTo(element, parent, completeCallback) {
        var done = false;
        element.onload = element.onreadystatechange = function () {
            var rs = this.readyState;
            if (!done && (!rs || rs === "loaded" || rs === "complete")) {
               done = true;
               completeCallback("success");
               element.onload = element.onreadystatechange = undefined;
               element.onerror = element.onabort = undefined;
           }
        };
        element.onerror = element.onabort = function () {
            done = true;
            completeCallback("error");
            element.onload = element.onreadystatechange = undefined;
            element.onerror = element.onabort = undefined;
            if (parent && element.parentNode) {
                parent.removeChild(element);
            }
        };
    }
    function getHead() {
        return document.getElementsByTagName("head")[0] || document.documentElement;
    }
    function loadDependency(context, src, lastCss, completeCallback) {
        var head = getHead(), sid = tagIdOf(src), css = sid[2], element,
            suffix = context.cfg.queryString;
        element = document.createElement(sid[3]);
        element.setAttribute(elementIdData, sid[0]);
        if (css) element.setAttribute("rel", "stylesheet");
        element[css ? "href" : "src"] = sid[1] + (suffix ? "?" + suffix : "");
        if (!css) bindLoadBehaviourTo(element, head, completeCallback);
        if (sid[4] && head.firstChild) {
            head.insertBefore(element, lastCss || head.firstChild);
        } else {
            head.appendChild(element);
        }
        if (css) completeCallback("success", element);
    }
    function loadComponent_jQuery(context, url, completeCallback) {
        var cache = (context.cfg.mode === will.modes.PROD),
            suffix = context.cfg.queryString,
            jsonp, done = false, location = window.location, debug = context.cfg.debug;
        jsonp = (/^(\w+:)?\/\/([^\/]+)/.test(url) && (RegExp.$2 != location.host || RegExp.$1 && RegExp.$1 != location.protocol));
        if (suffix) {
            cache = true;
            url = url + "?" + suffix;
        }
        window.jQuery.ajax({
            dataType: jsonp ? "jsonp" : "html",
            success: function (data) {
                if (done) return;
                done = true;
                if (debug) debug(" * successful loaded " + url);
                completeCallback(200, data);
            },
            complete: function (xhr, status) {
                if (done) return;
                done = true;
                if (debug) debug(" * completed " + url);
                completeCallback(xhr.status, xhr.responseText);
            },
            cache: cache,
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
                setTimeout(function () {self.process();}, 0);
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
                    }, 2);
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
                requireAssets(context, [url])(function (status) {
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
                        if (isString(data)) data = eval("("+data+")");
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
        processors.loadDependenciesAndCall = newProcessor(function (context, entry, args) {
            var self = this, debug = context.cfg.debug,
                assets = entry.assets || entry.libs, asset, r;
            if (assets.length) {
                asset = assets[0];
                if (r = isLoaded(asset)) {
                    assets.shift();
                    if (r[0]) entry.lastCss = r[1];
                    entry.impl.apply(undefined, args);
                } else {
                    if (debug) debug("** loading asset \"" + asset + "\"");
                    loadDependency(context, asset, entry.lastCss, function (status, css) {
                        try {
                            if (status === "success") {
                                assets.shift();
                                if (css) entry.lastCss = css;
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
            extend(context, will.u.getConfig());
            if (! ("call" in context)) extend(context, basicApi);
        }
        if (isFunction(initConfig)) initConfig(context.cfg);
    }
    function entryOf(registry, path) {
        var pn = path.packageName,
            dn = path.domainName,
            r = registry[dn] || (registry[dn] = {}),
            p = r[pn] || (r[pn] = {}),
            n = path.name;
        return p[n] || (p[n] = {rescue: function () {/*delete p[n];*/}});
    }
    function implWrapper(context, entry, f) {
        var func = function () {return f.apply(context, arguments);},
            impl = "impl", name = impl;
        if (isString(f)) {
            name = f;
            f = entry[name];
        }
        entry[name] = function () {
            var args = arguments, assets = entry.assets || entry.libs;
            if (assets && assets.length) {
                process(context, "loadDependenciesAndCall", [context, entry, args]);
            } else {
                entry[name] = (name == impl ? func : f);
                return entry[name].apply(entry, args);
            }
        };
    }
    function registerFunctions(context, registry, funcs, path) {
        if (isntObject(funcs)) return;
        var entry,
            f = funcs.impl || isFunction(funcs.getImpl) && funcs.getImpl(context),
            l = funcs.assets || funcs.libs;
        if (isFunction(f)) {
            entry = entryOf(registry, path);
            entry.assets = isntObject(l) || !isArray(l) ? [] : l;
            implWrapper(context, entry, f);
            entry.rescue = funcs.rescue || entry.rescue;
        } else {
            for(f in funcs) {
                path.name = f;
                registerFunctions(context, registry, funcs[f], path);
            }
        }
    }
    function pathFor(context, strPath, format) {
        var cfg = context.cfg,
            d = cfg.domains,
            domainName = "local",
            packageName = cfg.defaultPackage,
            name = strPath.toString();
        if ( /^(?:(\w+):)?(?:(\w+)\.)?(\w+)$/.test(name) ){
            name = RegExp.$3;
            packageName = RegExp.$2 || cfg.packages[name] || packageName;
            domainName = RegExp.$1 || domainName;
        }
        if (!d[domainName]) domainName = "local"
        return {
            format: format || d[domainName][0],
            domain: d[domainName][1],
            mode: d[domainName][2],
            domainName: domainName,
            packageName: packageName,
            name: name,
            toString: function() {
                return domainName + ":" + packageName + "." + name;
            }
        };
    }
    function urlFor(context, path, mode) {
        var cfg = context.cfg,
            pn = path.packageName, n = path.name;
        if (mode == undefined) mode = path.mode;
        if (mode == undefined) mode = cfg.mode;
        return path.domain
            + (mode == will.modes.PROD
                ? pn
                : pn == cfg.defaultPackage
                    ? n
                    : pn + "/" + n)
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
                path = pathFor(context, funcPath);
            process(context, "callComponent", [context, path, args]);
        };
    }
    function requireAssets(context, assets) {
        var entry = {assets: assets};
        return function (loadCallback) {
            if (entry.impl) return;
            var func, rescue;
            if (isFunction(loadCallback)) {
                func = function () {loadCallback("success");};
                rescue = function () {loadCallback("error");};
            } else {
                func = rescue = function () {};
            }
            implWrapper(context, entry, func);
            entry.rescue = rescue;
            entry.impl();
        };
    }

    // The Public API
    extend(basicApi, {
        "call": function (selector) {
            return stubsTo(this, selector);
        },
        "use": function (assets) {
            return requireAssets(this, isArray(assets) ? assets : slice.call(arguments, 0));
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
        "u.extend": extend,
        "as": function (name) {
            if (!name) return name;
            return window[name] || (window[name] = new WillJS(name, true));
        },
        "configure": function (initConfig) {
            setup(this, false, initConfig);
            return this;
        },
        "reconfigure": function (initConfig) {
            setup(this, true, initConfig);
            return this;
        }
    });
    extend(WillJS.prototype, basicApi);

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
    basicApi.u.extend({
        "pathFor": pathFor,
        "urlFor": urlFor,
        "implWrapper": implWrapper,
        "newProcessor": newProcessor,
        "getConfig": function () {
            var self = this, cfg;
            cfg = extend(new self.Defaults(), {
                "processors": new self.Processors(),
                "domains": {
                    "local": ["json", "/javascripts/will/"]
                },
                "packages": {}
            });
            return {cfg: cfg, registry: {}};
        },
        "Processors": function () {},
        "Defaults": function () {}
    });
    addDefaultProcessors(basicApi.u.Processors.prototype);
    extend(basicApi.u.Defaults.prototype, {
        "mode": will.modes.DEV,
        "version": "1.2",
        "addDomain": function (domainName, urlPrefix, asJS, mode) {
            this.domains[domainName] = [(isString(asJS) ? asJS : asJS ? "js" : "json"), urlPrefix + (/\/$/.test(urlPrefix) ? "" : "/")];
            if (mode != undefined) this.domains[domainName][2] = mode;
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
})(window, "will", null);
