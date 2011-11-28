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
    var will = {}, basicApi = {}, templateApi = {},
        assetIdData = "data-willjs-id",
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
    }
    function tagIdOf(asset, link) {
        var sid = undefined, seg;
        if (isString(asset)) {
            if ( /^([\w\-\.]+)\@(.+)$/.test(asset) ) {
                sid = [RegExp.$1, RegExp.$2];
            } else {
                seg = asset.split(/[\?#]/)[0].split(/\//);
                seg = seg[seg.length -1];
                sid = [
                    /^([\w\-\.]+?)(?:\.min|\-\d+(?:\.\d+)*(?:\w+)?)*\.(?:css|js)$/.test(seg)
                        ? RegExp.$1
                        : seg,
                    asset
                ];
            }
        } else {
            sid = [asset.getAttribute(assetIdData), link ? asset.href : asset.src];
            if (! sid[0]) sid = tagIdOf(sid[1], link);
        }
        return sid;
    }
    function isLoaded(asset, link) {
        var elements = document.getElementsByTagName(link ? "link" : "script"),
            sid = tagIdOf(asset)[0], i, len = elements.length;
        for (i = 0; i < len; ) {
            if (tagIdOf(elements[i++], link)[0] === sid) {
                return true;
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
        parent.appendChild(element);
    }
    function getHead() {
        return document.getElementsByTagName("head")[0] || document.documentElement;
    }
    function loadLib(src, completeCallback) {
        var head = getHead(), sid = tagIdOf(src),
            script = document.createElement("script");
        script.setAttribute(assetIdData, sid[0]);
        script.src = sid[1];
        bindLoadBehaviourTo(script, head, completeCallback);
    }
    function loadStyle(href, completeCallback) {
        var head = getHead(), sid = tagIdOf(href, true),
            link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", sid[1]);
        bindLoadBehaviourTo(link, head, completeCallback);
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
    function defaultConfig() {
        return {
            "mode": will.modes.DEV,
            "processors": {},
            "domains": {
                "local": ["json", "/javascripts/will/"]
            },
            "addDomain": function (domainName, urlPrefix, asJS) {
                this.domains[domainName] = [(asJS ? "js" : "json"), urlPrefix + (/\/$/.test(urlPrefix) ? "" : "/")];
            },
            "render": function (templateBody, data) {
                var txt = templateBody;
                for (k in data) {txt = txt.replace(new RegExp("{{"+k+"}}", "g"), data[k]);}
            },
            "renderTemplateWith": function (renderer) {this.render = renderer},
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
    function newTemplateEntry(context, path) {
        var obj = {
            path: path,
            location: urlFor(context, path)
        };
        extend.call(obj, templateApi);
        for (k in obj) {
            if (isFunction(obj[k])) {
                wrapRender(context, obj, k)
            }
        }
        obj.context = function () {return context;};
        return obj;
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
        processors.loadTemplateAndCall = newProcessor(function (context, template, method, args) {
            var url = template.location, line, tokens, i, len, content = template.content;
            if (content) {
                template[method].apply(undefined, args);
                return;
            }
            will.u[loadComponentMethodName](context, url, function (statusCode, data) {
                try {
                    if (statusCode !== 200) {
                        throw "could not load template: " + template.path;
                    }
                    content = {deps:{style:[],trigger:[]}};
                    tokens = data.split(/\r?\n/);
                    len = tokens.length;
                    while (tokens.length) {
                        line = tokens[0];
                        if (!line) {
                            tokens.shift();
                            break;
                        }
                        if (/^([^\s]+)\s+(.*)$/.test(line) && (RegExp.$1 in content.deps)) {
                            content.deps[RegExp.$1].push(RegExp.$2);
                            tokens.shift();
                        } else {
                            break;
                        }
                    }
                    content.body = tokens.join("\n");
                    template.content = content;
                    template[method].apply(undefined, args);
                } finally {
                    self.sched();
                }
            });
            return false;
        });
        processors.loadStylesAndCall = newProcessor(function (context, template, method, args) {
            var content = template.content, styles, style;
            styles = content && content.deps.style || [];
            if (styles.length) {
                style = styles[0];
                if (isLoaded(style, true)) {
                    styles.shift();
                    template[method].apply(undefined, args);
                } else {
                    loadStyle(style, function (status) {
                        try {
                            if (status === "success") {
                                styles.shift();
                                template[method].apply(undefined, args);
                            }
                        } finally {
                            self.sched();
                        }
                    });
                    return false;
                }
            } else {
                template[method].apply(undefined, args);
            }
        });
    }
    function setup(context, reset, initConfig) {
        if (reset || ! ("cfg" in context)) {
            extend.call(context, "cfg", defaultConfig());
            context.registry = {};
            context.templates = {};
            addDefaultProcessors(context.cfg.processors);
            if (! ("call" in context)) extend.call(context, basicApi);
        }
        if (isFunction(initConfig)) initConfig(context.cfg);
    }
    function entryOf(registry, path) {
        var pn = path.packageName,
            p = registry[pn] || (registry[pn] = {}),
            n = path.name;
        return p[n] || (p[n] = {rescue: function () {/*delete p[n];*/}});
    }
    function templateObj(context, repository, path) {
        var pn = path.packageName,
            p = repository[pn] || (repository[pn] = {}),
            n = path.name;
        return p[n] || (p[n] = newTemplateEntry(context, path));
    }
    function wrapRender(context, template, method) {
        var f = template[method], func = function () {return f.apply(template, arguments);};
        template[method] = function () {
            var args = arguments;
            if (!template.content) {
                process(context, "loadTemplateAndCall", [context, template, method, args]);
            } else if (template.content.deps.style.length) {
                process(context, "loadStylesAndCall", [context, template, method, args]);
            } else {
                template[method] = func;
                f.apply(template, args);
            }
        };
    }
    function insertContentWrapper(func) {
        return function (element, data) {
            var self = this, context = self.context(), content = self.content, i,
                trigger = content.deps.trigger, len = trigger.length;
            content = $(context.cfg.render(content.body, data));
            func(element, content);
            for (i = 0; i < len; ) {
                context.call(trigger[i])(content, data);
            }
        };
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
            packageName: packageName,
            name: name,
            toString: function() {
                return domainName + ":" + packageName + "." + name;
            }
        };
    }
    function urlFor(context, path) {
        var cfg = context.cfg,
            pn = path.packageName, n = path.name;
        return path.domain
            + (cfg.mode == will.modes.PROD && path.format != "wtpl"
                ? pn
                : pn == cfg.defaultPackage
                    ? n
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
    extend.call(templateApi, {
        "append": insertContentWrapper(function (element, content) {
            element.append(content);
        }),
        "insertBefore": insertContentWrapper(function (element, content) {
            content.insertBefore(element);
        })
    });

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

    // Initial setup
    setup(will, false);
})(window, null);
