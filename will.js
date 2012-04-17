/*!
 * WillJS JavaScript Library v1.2.2
 * http://github.com/kawamanza/will.js
 *
 * Copyright 2011-2012, Marcelo Manzan
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Sun Apr 01 17:09:14 2012 -0300
 */

(function (window, globalName, undefined) {
    "use strict";

    var will, basicApi = {},
        elementIdData = "data-willjs-id",
        SID_PATTERN = /^\^?([\w\-\.]+?)(?:\.min|\-\d+(?:\.\d+)*(?:\w+)?)*\.(?:css|js)$/,
        slice = Array.prototype.slice,
        toString = Object.prototype.toString,
        loadComponentMethodName = "loadComponent",
        protocol = window.location.protocol,
        document = window.document;

    // -- Private Methods ------------------------------------------------------

    /**
     * WillJS constructor method
     * @param {String} name Global variable name (window[name])
     * @param {Boolean} prepare Run setup
     * @private
     */
    function WillJS(name, prepare) {
        this.name = name;
        if (prepare) setup(this, false);
    }
    window[globalName] = will = new WillJS(globalName);

    /**
     * Verify if a value is of type String
     *
     * @method isString
     * @param {Object} value Object to be verified of type String
     * @return {Boolean}
     * @private
     */
    function isString(value) {
        return typeof value === "string";
    }

    /**
     * Verify if a value is of type Array
     *
     * @method isArray
     * @param {Object} value Object to be verified of type String
     * @return {Boolean}
     * @private
     */
    function isArray(value) {
        return toString.call(value) === "[object Array]"
    }

    /**
     * Verify if a value isn't an Object
     *
     * @method isntObject
     * @param {Object} value Object to be verified
     * @return {Boolean}
     * @private
     */
    function isntObject(value) {
        return typeof value !== "object";
    }

    /**
     * Verify if a value is of type Function
     *
     * @method isFunction
     * @param {Object} value Object to be verified of type Function
     * @return {Boolean}
     * @private
     */
    function isFunction(value) {
        return typeof value === "function";
    }

    /**
     * Checks if an URL is of kind CSS
     *
     * @method isCss
     * @param {String} href URL of an asset
     * @return {Boolean}
     * @private
     */
    function isCss(href) {
        return /\.css$/.test(href);
    }

    /**
     * Fetches nested keys on a root Hash and sets the value in the key deeper.
     *
     * @method fill
     * @param {Hash} root Object to be filled
     * @param {String,Array} keys Nested subkeys to be fetched
     * @param {Object} value The value
     * @private
     */
    function fill(root, keys, value) {
        var key, v;
        if (isString(keys)) {
            keys = keys.split(/\./);
        }
        key = keys.shift();
        if (key.charAt(0) == ":") {
            keys.unshift(key.substr(1));
            root[keys.join(".")] = value;
            return;
        }
        if (keys.length == 0) {
            if (isFunction(value) && /^(.+?)([^\w])$/.test(key)) {
                key = RegExp.$1;
                if (RegExp.$2 == "=") {
                    root.__defineSetter__(key, value);
                } else {
                    root.__defineGetter__(key, value);
                }
            } else {
                root[key] = value;
            }
        } else {
            v = root[key];
            if (isntObject(v) || isArray(v)) {
                v = {};
                root[key] = v;
            }
            fill(v, keys, value);
        }
    }

    /**
     * Extends the original hash with attributes of other hash.
     *
     * @method extend
     * @return {Hash} The extended hash.
     * @protected
     */
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
            if (hash.hasOwnProperty(k)) fill(self, key + k, hash[k]);
        }
        return self;
    }

    /**
     * Forces a function to run into a specific scope.
     *
     * @method scopedFunction
     * @param {Object} scope The context
     * @param {Function} func The original function
     * @return {Function} A function wrapper
     * @private
     */
    function scopedFunction(scope, func) {
        return function () {return func.apply(scope, arguments);};
    }

    /**
     * Removes the queryString and anchors of an asset URL.
     *
     * @method uncachedAsset
     * @param {String} asset The URL of an asset.
     * @return {String} The URL without any queryString or anchor suffixes
     * @private
     */
    function uncachedAsset(asset) {
        return asset.split(/[\?#]/)[0];
    }

    /**
     * Gets an object information of an asset (id, href, isCss,
     * tagName:"link|script", isPrepend).
     *
     * @method tagInfoOf
     * @param {String} asset The URL of an asset
     * @return {Hash} An object information of the asset
     * @private
     */
    function tagInfoOf(asset) {
        var info = undefined, seg;
        if (isString(asset)) {
            asset = uncachedAsset(asset);
            if ( /^([\w\-\.]+)\@(.+)$/.test(asset) ) {
                info = {id: RegExp.$1, href: RegExp.$2};
            } else {
                seg = asset.split(/\//);
                seg = seg[seg.length -1];
                info = {
                    id: (SID_PATTERN.test(seg) ? RegExp.$1 : seg),
                    href: asset
                };
                if (isCss(asset)) {
                    seg = asset.split(/\/+/);
                    if (/^\^?(\w+:|)$/.test(seg[0])) seg.shift();
                    seg.pop();
                    seg.push(info.id);
                    info.id = seg.join("_").replace(/:/, "-");
                }
            }
        } else {
            seg = asset.src || asset.href;
            info = {id: asset.getAttribute(elementIdData), href: uncachedAsset(seg || "")};
            asset = info.href;
            if (! info.id && asset) info = tagInfoOf(asset);
        }
        if (! info.tn) {
            info.css = isCss(asset);
            info.tn = (info.css ? "link" : "script");
            info.pre = /^\^/.test(asset);
            if (info.pre) info.href = asset.substr(1);
        }
        asset = info.href;
        if (/^\/\//.test(asset) && protocol != "https:") info.href = "http:" + asset;
        return info;
    }

    /**
     * Gets node elements from document.
     *
     * @method getElements
     * @param {String} tagName The tag's name.
     * @return {Collection} A collection of tags
     */
    function getElements(tagName) {
        return document.getElementsByTagName(tagName);
    }

    /**
     * Checks if the asset is already imported to the current page.
     *
     * @method isLoaded
     * @param {String} asset The URL of an asset.
     * @return {Boolean}
     * @private
     */
    function isLoaded(asset) {
        var info = tagInfoOf(asset), id = info.id, href = info.href, css = info.css,
            elements = getElements(info.tn),
            i, len = elements.length, el;
        for (i = 0; i < len; ) {
            el = elements[i++];
            if (tagInfoOf(el).id === id) {
                if (/\@/.test(asset) && css && el.href != href) el.href = href;
                return [css, el];
            }
        }
        return false;
    }

    /**
     * Bind the onLoad callback to script elements.
     *
     * @method bindLoadBehaviourTo
     * @param {NodeElement} element The <script/> node
     * @param {NodeElement} parent The parentNode of the <script/>
     * @param {Function} completeCallback The callback to receive the state
     *      message ("success" or "error")
     * @param {Boolean} removeElement Flag to remove <script/> node from the
     *      page even on success.
     * @private
     */
    function bindLoadBehaviourTo(element, parent, completeCallback, removeElement) {
        var done = false;
        element.onload = element.onreadystatechange = function () {
            var rs = this.readyState;
            if (!done && (!rs || rs === "loaded" || rs === "complete")) {
                done = true;
                completeCallback("success");
                element.onload = element.onreadystatechange = undefined;
                element.onerror = element.onabort = undefined;
                if (removeElement && parent && element.parentNode) {
                    parent.removeChild(element);
                }
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

    /**
     * Gets the <head/> element.
     *
     * @method getHead
     * @return {NodeElement} The <head/> element.
     */
    function getHead() {
        return getElements("head")[0] || document.documentElement;
    }

    /**
     * Checks the CSS hierarchy order.
     *
     * @method cssOrder
     * @param {NodeElement} element1 The <link/> element that should be achieved
     *      first.
     * @param {NodeElement} element2 The <link/> element that should be achieved
     *      last.
     * @return {Boolean}
     */
    function cssOrder(element1, element2) {
        var i, links = getElements("link"), len = links.length;
        for(i = 0; i < len; i++) {
            if (links[i] === element1) return true;
            if (links[i] === element2) return false;
        }
    }

    /**
     * Inserts the <link/> element near other elements of the same kind.
     *
     * @method insertCss
     * @param {NodeElement} element The <link/> element to be inserted.
     * @param {NodeElement} lastCss The <link/> element ref.
     */
    function insertCss(element, lastCss) {
        lastCss = lastCss || getElements("link")[0];
        if (lastCss) {
            getHead().insertBefore(element, lastCss);
        } else {
            getHead().appendChild(element);
        }
    }

    /**
     * Processor constructor method
     *
     * @param {Function} func The queue processor function.
     */
    function Processor(func) {
        extend(this, {queue: [], active: false, run: func});
    }
    extend(Processor.prototype, {
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
    });

    // -- Context Methods ------------------------------------------------------

    /**
     * Includes the dependency into the page.
     *
     * @method loadDependency
     * @param {WillJS} context WillJS object context
     * @param {String} src The URL of asset to be loaded
     * @param {NodeElement} lastCss Last <link/> element added to the page
     * @param {Function} completeCallback The callback to receive the state
     *      message ("success" or "error")
     * @param {Boolean} removeElement Flag to remove <script/> node from the
     *      page even on success.
     * @private
     */
    function loadDependency(context, src, lastCss, completeCallback, removeElement) {
        var head = getHead(), info = tagInfoOf(src), css = info.css, href = info.href, element,
            suffix = context.cfg.queryString;
        element = document.createElement(info.tn);
        element.setAttribute(elementIdData, info.id);
        if (css) element.setAttribute("rel", "stylesheet");
        if (isFunction(suffix)) {suffix = suffix(href);}
        element[css ? "href" : "src"] = href + (suffix ? "?" + suffix : "");
        if (css) {
            if (info.pre) {
                insertCss(element, lastCss);
            } else if (lastCss && lastCss.nextSibling) {
                head.insertBefore(element, lastCss.nextSibling);
            } else {
                insertCss(element);
            }
            completeCallback("success", element);
        } else {
            bindLoadBehaviourTo(element, head, completeCallback, removeElement);
            head.appendChild(element);
        }
    }

    /**
     * A method missing plugin loader
     *
     * @method missingMethod
     * @param {String} methodName The attribute method to call
     * @param {String} pluginFile The file basename into rootDir
     * @param {WillJS} context WillJS object context (optional)
     */
    function missingMethod(methodName, pluginFile, context) {
        var self = this, done = false, args;
        if (!context) context = will;
        self[methodName] = function () {
            if (done) return;
            args = arguments;
            context.use(
                "willjsPlugin-" + methodName + "@" + context.rootDir + pluginFile
            )(function (status) {
                done = true;
                if (status === "success") {
                    self[methodName].apply(self, args)
                }
            });
        };
    }

    /**
     * Prepare the WillJS instance with default configuration.
     *
     * @method setup
     * @param {WillJS} context WillJS object context
     * @param {Boolean} reset Flag to reset the configuration
     * @param {Function} initConfig Preparing function.
     * @private
     */
    function setup(context, reset, initConfig) {
        if (reset || ! ("cfg" in context)) {
            extend(context, getConfig());
            if (! ("call" in context)) extend(context, basicApi);
        }
        if (isFunction(initConfig)) initConfig(context.cfg);
    }

    /**
     * Gets or creates a component entry from the component registry.
     *
     * @method entryOf
     * @param {Hash} registry The WillJS component registry
     * @param {Path} path The component's path into the registry
     * @return {Hash} An entry of a component
     * @private
     */
    function entryOf(registry, path) {
        var pn = path.packageName,
            dn = path.domainName,
            r = registry[dn] || (registry[dn] = {}),
            p = r[pn] || (r[pn] = {}),
            n = path.name;
        return p[n] || (p[n] = {rescue: function () {/*delete p[n];*/}});
    }

    /**
     * Involves the original component's function until all dependencies were loaded.
     *
     * @method implWrapper
     * @param {WillJS} context WillJS object context
     * @param {Hash} entry The entry of a component
     * @param {Function,String} f The entry function to be involved
     * @private
     */
    function implWrapper(context, entry, f) {
        var impl = "impl", name = impl;
        if (isString(f)) {
            name = f;
            f = entry[name];
        }
        entry[name] = function () {
            var args = arguments, assets = entry.assets;
            if (assets && assets.length) {
                process(context, "loadDependenciesAndCall", [context, entry, args]);
            } else {
                (entry[name] = (name == impl ? scopedFunction(context, f) : f)).apply(entry, args);
            }
        };
    }

    /**
     * Register components into registry.
     *
     * @method registerFunctions
     * @param {WillJS} context WillJS object context
     * @param {Hash} registry The WillJS component registry
     * @param {Hash} comp The component loaded from URL
     * @param {Path} path The component's path into the registry
     * @private
     */
    function registerFunctions(context, registry, comp, path) {
        if (isntObject(comp)) return;
        var entry,
            f = comp.impl || isFunction(comp.getImpl) && comp.getImpl(context),
            l = comp.assets;
        if (isFunction(f)) {
            entry = entryOf(registry, path);
            entry.assets = isntObject(l) || !isArray(l) ? [] : l;
            implWrapper(context, entry, f);
            entry.rescue = comp.rescue || entry.rescue;
        } else {
            for(f in comp) {
                path.name = f;
                registerFunctions(context, registry, comp[f], path);
            }
        }
    }

    /**
     * Gets a path information from a component call.
     *
     * @method pathFor
     * @param {WillJS} context WillJS object context
     * @param {String} strPath The component call path
     * @return {Hash} The component path information.
     */
    function pathFor(context, strPath) {
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
        if (!d[domainName]) domainName = "local";
        return extend({
            domainName: domainName,
            packageName: packageName,
            name: name,
            toString: function() {
                return domainName + ":" + packageName + "." + name;
            }
        }, d[domainName]);
    }

    /**
     * Builds the URL for a component's path.
     *
     * @method urlFor
     * @param {WillJS} context WillJS object context
     * @param {Path} path The component's path into the registry
     * @param {Integer} mode Dev mode or Prod mode
     * @return {String} The URL for the resource
     * @private
     */
    function urlFor(context, path, mode) {
        var cfg = context.cfg,
            pn = path.packageName, n = path.name;
        if (mode == undefined) mode = path.mode;
        if (mode == undefined) mode = cfg.mode;
        return (path.domain || context.defaultDomain)
            + (mode == will.modes.PROD
                ? pn
                : pn == cfg.defaultPackage
                    ? n
                    : pn + "/" + n)
            + "." + path.format;
    }

    /**
     * Queue up the arguments to be processed sequentialy.
     *
     * @method process
     * @param {WillJS} context WillJS object context
     * @param {String} handler The processor name from list of processors
     * @param {Array} args The arguments to process with the processor
     * @private
     */
    function process(context, handler, args) {
        var r = context.cfg.processors,
            p = r[handler];
        if (!p) {
            p = r[handler] = new Processor(function(f) {if (isFunction(f)) f();});
        }
        p.process(args);
    }

    /**
     * Loads a list of assets.
     *
     * @method requireAssets
     * @param {WillJS} context WillJS object context
     * @param {Array} assets A list of assets to load
     * @param {Boolean} removeElement Flag to remove <script/> node from the
     *      page even on success.
     * @return {Function} A function to trigger the assets loading
     * @private
     */
    function requireAssets(context, assets, removeElement) {
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
            entry.removeElement = removeElement;
            entry.impl();
        };
    }

    // -- The Public API -------------------------------------------------------

    extend(basicApi, {
        "call": function (compPath) {
            var context = this;
            return function () {
                process(context, "callComponent", [context, compPath, arguments]);
            };
        },
        "use": function (assets) {
            return requireAssets(this, isArray(assets) ? assets : slice.call(arguments, 0), false);
        },
        "addComponent": function (selector, json) {
            var context = this;
            return registerFunctions(context, context.registry, json, pathFor(context, selector));
        },
        "addProcessor": function (processorName, func) {
            var r = this.cfg.processors, p = r[processorName];
            if (!p) r[processorName] = new Processor(func);
        },
        "process": function (processorName) {
            process(this, processorName, slice.call(arguments, 1));
        },
        "modes": {DEV:0, PROD:1},
        "u.hit": missingMethod,
        "u.extend": extend,
        "as": function (name) {
            if (!name) return name;
            return window[name] || (window[name] = new WillJS(name, true));
        },
        "configure": function (initConfig) {
            var self = this;
            self.configured = true;
            setup(self, false, initConfig);
            return self;
        },
        ":defaultDomain!": function () {
            var self = this, cfg = self.cfg, dom = cfg._dom;
            if (!dom) {
                cfg._dom = dom = self.rootDir + "components/";
            }
            return dom;
        },
        ":rootDir!": function () {
            var cfg = this.cfg, dir = cfg._dir, elements, len, i, info;
            if (!dir) {
                elements = getElements("script");
                for(i = 0, len = elements.length; i < len; i++) {
                    info = tagInfoOf(elements[i]);
                    if (info.id == "will") {
                        dir = info.href.replace(/\/?[^\/]+$/, "/will/");
                        break;
                    }
                }
                cfg._dir = dir = (dir ? dir.replace(/\/will\/will\/$/, "/will/") : "/javascripts/will/");
            }
            return dir;
        }
    });
    extend(WillJS.prototype, basicApi);

    // -- Helper Methods -------------------------------------------------------

    basicApi.u.hit(loadComponentMethodName, "componentLoader.js");

    // -- Config Methods -------------------------------------------------------

    function getConfig() {
        return {
            registry: {},
            cfg: extend(new Defaults(), {
                    "processors": new Processors(),
                    "domains": {
                        "local": {format:"json"}
                    },
                    "packages": {}
                })
        };
    }

    function Defaults() {}
    extend(Defaults.prototype, {
        "mode": will.modes.DEV,
        "version": "1.2.2",
        "addDomain": function (domainName, urlPrefix, asJS, mode) {
            this.domains[domainName] = {format:(isString(asJS) ? asJS : asJS ? "js" : "json"), domain: urlPrefix + (/\/$/.test(urlPrefix) ? "" : "/"), mode: mode};
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

    function Processors() {}
    extend(Processors.prototype, {
        "callComponent": new Processor(function (context, compPath, args) {
            if (!context.configured) {
                context.use(context.rootDir + "config.js")(function () {
                    context.configured = true;
                    process(context, "callComponent", [context, compPath, args]);
                });
                return;
            }
            var self = this,
                registry = context.registry,
                path = pathFor(context, compPath),
                url = urlFor(context, path),
                entry = entryOf(registry, path),
                impl = entry.impl;
            if (impl) {
                impl.apply(undefined, args);
                return;
            }
            if (path.format == "js") {
                url = path.toString().replace(/[:\.]/g, "_") + "@" + url;
                requireAssets(context, [url], true)(function (status) {
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
        }),
        "loadDependenciesAndCall": new Processor(function (context, entry, args) {
            var self = this, debug = context.cfg.debug,
                assets = entry.assets, asset, r, pre, el;
            if (assets.length) {
                asset = assets[0];
                pre = /^(?:[^@]+@)?\^/.test(asset);
                if (r = isLoaded(asset)) {
                    assets.shift();
                    if (r[0]) {
                        if (entry.lastCss) {
                            el = entry.bottomCss.nextSibling;
                            if (pre && cssOrder(entry.lastCss, r[1])) {
                                insertCss(r[1], entry.lastCss);
                            } else if (el && cssOrder(r[1], entry.bottomCss)) {
                                insertCss(r[1], el);
                            }
                        }
                        if (!(entry.lastCss && pre)) entry.bottomCss = r[1];
                        entry.lastCss = r[1];
                    }
                    entry.impl.apply(undefined, args);
                } else {
                    if (debug) debug("** loading asset \"" + asset + "\"");
                    loadDependency(context, asset, entry[pre ? "lastCss" : "bottomCss"], function (status, css) {
                        try {
                            if (status === "success") {
                                assets.shift();
                                if (css) {
                                    if (!(entry.lastCss && pre)) entry.bottomCss = css;
                                    entry.lastCss = css;
                                }
                                entry.impl.apply(undefined, args);
                            } else {
                                entry.rescue.apply(undefined, args);
                            }
                        } finally {
                            self.sched();
                        }
                    }, entry.removeElement);
                    return false;
                }
            } else {
                entry.impl.apply(undefined, args);
            }
        })
    });

    // -- Initial Setup --------------------------------------------------------

    setup(will, false);
})(window, "will", null);
