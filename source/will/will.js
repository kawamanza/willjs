/*!
 * WillJS JavaScript Library v1.8.2
 * http://github.com/kawamanza/willjs/
 *
 * Copyright 2011-2012, Marcelo Manzan
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Tue Jun 12 20:16:45 2012 -0300
 */

(function (window, globalName, undefined, jsId) {
    "use strict";

    var will, basicApi = {},
        elementIdData = "data-willjs-id",
        success = "success",

        CSS_PATTERN = /\.css$/,
        JS_PATTERN = /\.js$/,
        MULTI_SLASH_SPLIT_PATTERN = /\/+/,
        PROTOCOL_PATTERN = /^[\^\+]?(?:\w+:|)$/,
        FALLBACK_ASSET_PATTERN = /^(?:[^@]+@)?\|/,
        SID_PATTERN = /^([\w\-\.]+?)(?:\.min|\-\d+(?:\.\d+)*(?:\.?\w+)?)*\.(?:css|js)$/,
        ASSET_CAPTURE = /^(?:([\w\-\.]+)\@)?([^#\?]+)(?:(\?[^#]*))?/,
        ASSET_TERM = /^[\w\-]+$/,
        COMPONENT_PATH_CAPTURE = /^(?:(\w+):)?(?:(\w+)\.)?(\w+)$/,

        slice = Array.prototype.slice,
        toString = Object.prototype.toString,

        protocol = window.location.protocol,
        document = window.document;

    // -- Private Methods ------------------------------------------------------

    /**
     * WillJS constructor method
     * @param {String} name Global variable name (window[name])
     * @param {Boolean} prepare Run setup
     * @private
     */
    function WillJS(name) {
        this.name = name;
        this.constructor = WillJS;
    }

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

    function copyTo(target, source) {
        var keys, prop, original, other, value;
        for (prop in source) {
            if (source.hasOwnProperty(prop)) {
                value = source[prop];
                if (prop.charAt(0) == ":") {
                    target[prop.substr(1)] = value;
                } else if ((keys = prop.split(/\./)).length > 1) {
                    prop = keys.shift();
                    original = target[prop];
                    if (isntObject(original) || isArray(original)) {
                        original = target[prop] = {};
                    }
                    prop = keys.join(".");
                    other = value;
                    if (prop) (other = {})[prop] = value;
                    copyTo(original, other);
                } else if (/\W$/.test(prop)) {
                    prop = RegExp['$`'];
                    other = {
                        get: function (){},
                        set: function (){},
                        enumerable: true,
                        configurable: true
                    };
                    if (isFunction(value)) {
                        if (RegExp['$&'] == '=') {
                            other.set = value;
                        } else {
                            other.get = value;
                        }
                    } else {
                        copyTo(other, value);
                    }
                    Object.defineProperty(target, prop, other);
                } else {
                    target[prop] = value;
                }
            }
        }
    }

    /**
     * Extends the original hash with attributes of other hash.
     *
     * @method extend
     * @return {Hash} The extended hash.
     * @protected
     */
    function extend(target) {
        var source, other, ctx
          , i = 1, args = arguments, len = args.length
        ;
        for ( ; i < len; i++) {
            source = args[i];
            if ( isString(source) ) {
                ctx = source;
            } else if (source) {
                other = source;
                if (ctx) (other = {})[ctx] = source;
                copyTo(target, other);
            }
        }
        return target;
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
     * Creates a node element.
     *
     * @method newElement
     * @param {String} name The tag name.
     * @param {Hash} attrs The hash of attributes.
     * @return {Element} A node element.
     * @private
     */
    function newElement(name, attrs) {
        var el = document.createElement(name), attr;
        for (attr in attrs) {
            if (attrs.hasOwnProperty(attr)) el.setAttribute(attr, attrs[attr]);
        }
        return el;
    }

    /**
     * Asset constructor method.
     *
     * @param {String} asset The asset href/src.
     * @param {String} dir The base directory for relative assets.
     */
    function Asset(asset, dir) {
        var href, id, qs, fixedId, css, seg, s
          , pre, pos
        ;
        if (isString(asset)) {
            fixedId = /\@/.test(asset);
        } else {
            href = asset.src || asset.href;
            id = asset.getAttribute(elementIdData);
            asset = (id ? id + "@" : "") + href;
        }
        if (ASSET_CAPTURE.test(asset)) {
            id = RegExp.$1;
            href = RegExp.$2;
            qs = RegExp.$3;
            s = href.charAt(0);
            pre = (s == "^");
            pos = (s == "+");
            if (pre || pos) {
                href = href.substr(1);
            }
            if (dir && href.charAt(0) == ".") {
                href = newElement("script", {src: dir + href}).src;
            }
            if (/^\/\//.test(href) && protocol != "https:") href = "http:" + href;
        }
        css = CSS_PATTERN.test(href);
        if (! id) {
            seg = href.split(MULTI_SLASH_SPLIT_PATTERN);
            s = seg.pop();
            id = SID_PATTERN.test(s) ? RegExp.$1 : s;
            if (css) {
                if (PROTOCOL_PATTERN.test(seg[0])) seg.shift();
                seg.push(id);
                id = seg.join("_").replace(/:/, "-");
            }
        }
        extend(this, {
            id: id,
            fixedId: fixedId,
            pre: pre,
            pos: pos,
            css: css,
            tn: (css ? "link" : "script"),
            qs: qs || "",
            href: href
        });
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
        var info = asset, id = info.id, href = info.href, css = info.css,
            elements = getElements(info.tn),
            i, len = elements.length, el, info2;
        for (i = 0; i < len; ) {
            el = elements[i++];
            info2 = new Asset(el);
            if (info2.id === id) {
                if (info.fixedId && css && info2.href != href) {
                    el.href = href + (info.qs || info2.qs);
                }
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
                completeCallback(success);
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
        var head = getHead(), info = src, css = info.css, href = info.href, element,
            qs = info.qs,
            suffix = context.cfg.queryString;
        if (qs) {suffix = qs.substr(1);} else
        if (isFunction(suffix)) {suffix = suffix(href);}
        else if (!suffix) {
            qs = context.info.qs;
            suffix = (qs ? qs.substr(1) : "")
        }
        element = {};
        element[elementIdData] = info.id;
        if (css) element["rel"] = "stylesheet";
        element[css ? "href" : "src"] = href + (suffix ? "?" + suffix : "");
        element = newElement(info.tn, element);
        if (css) {
            if (info.pre) {
                insertCss(element, lastCss);
            } else if (lastCss && lastCss.nextSibling) {
                head.insertBefore(element, lastCss.nextSibling);
            } else {
                insertCss(element);
            }
            completeCallback(success, element);
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
     * @param {String} pluginFile The file basename into will.info.dir folder
     * @param {Boolean} wrapper Flag to indicate the method returns a function
     *     stub.
     * @param {WillJS} context WillJS object context (optional)
     */
    function missingMethod(methodName, pluginFile, wrapper, context) {
        var self = this, done = false, args, args1, impl, func, info;
        if (!context) context = will;
        func = impl = function () {
            if (done) return;
            info = context.info;
            self = this;
            args = arguments;
            if (!wrapper) args1 = args;
            if (func.pluginFile == pluginFile && info.min) {
                pluginFile = func.pluginFile.replace(JS_PATTERN, ".min.js");
            }
            context.use(
                "willjsPlugin-" + methodName + "@" + info.dir + pluginFile + info.qs
            )(function (status) {
                done = true;
                if (status === success) {
                    impl = self[methodName].apply(self, args1);
                    if (wrapper) impl.apply(self, args);
                }
            });
        };
        if (wrapper) {
            func = function () {
                args1 = arguments;
                self = this;
                return function () { impl.apply(self, arguments); };
            };
        }
        func.pluginFile = pluginFile;
        self[methodName] = func;
    }

    /**
     * Prepare the WillJS instance with default configuration.
     *
     * @method setup
     * @param {WillJS} context WillJS object context
     * @param {Function} initConfig Preparing function.
     * @private
     */
    function setup(context, initConfig, isToPostLoad) {
        if (! ("cfg" in context)) {
            extend(context, getConfig());
            if (! ("use" in context)) extend(context, basicApi);
        }
        if (isFunction(initConfig)) {
            var postLoad = context.cfg.postLoad;
            if (isToPostLoad) {
                if (context.configured) {
                    initConfig(context.cfg);
                } else {
                    postLoad.push(initConfig);
                }
            } else {
                initConfig(context.cfg);
                while (postLoad.length) {
                    postLoad.shift()(context.cfg);
                }
            }
        }
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
            if (entry.getResponder) {
                f = entry.getResponder(context);
                delete entry.getResponder;
            } else
            if (entry.getImpl) {
                f = entry.getImpl(context);
                delete entry.getImpl;
            }
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
     * @param {Hash} comp The component loaded from URL
     * @param {Path} path The component's path into the registry
     * @private
     */
    function registerFunctions(context, comp, path) {
        if (isntObject(comp)) return;
        if (isString(path)) path = new Path(context, path);
        var entry,
            f = comp.impl,
            l = comp.assets;
        if (isFunction(f || comp.getImpl || comp.getResponder)) {
            entry = path.entry;
            entry.assets = isntObject(l) || !isArray(l) ? [] : l;
            entry.getResponder = comp.getResponder || comp.getImpl;
            implWrapper(context, entry, f);
            entry.rescue = comp.rescue || entry.rescue;
        } else {
            for(f in comp) {
                path.name = f;
                registerFunctions(context, comp[f], path);
            }
        }
    }

    /**
     * Gets a path information from a component call.
     *
     * @param {WillJS} context WillJS object context
     * @param {String} name The component call path
     */
    function Path(context, name, version) {
        var cfg = context.cfg,
            fullname,
            d = cfg.domains,
            modes = context.modes,
            domainName, packageName;
        if (COMPONENT_PATH_CAPTURE.test(name)) {
            name = RegExp.$3;
            packageName = RegExp.$2 || cfg.packages[name] || cfg.defaultPackage;
            domainName = RegExp.$1 || "local";
        }
        d = d[domainName] || d.local || {};
        fullname = (packageName === cfg.defaultPackage ? "" : (packageName + ".")) + name;
        extend(this, {
            domainName: domainName,
            packageName: packageName,
            name: name,
            fullname: fullname.replace(/\./g, "/"),
            version: version || "latest",
            base: d.domain,
            format: d.format || "json",
            prod: (d.mode || cfg.mode || modes.DEV) == modes.PROD,
            ctx: context
        });
    }
    extend(Path.prototype, {
        "dir!": function() {
            var dir = this._dir(), v, i;
            if (/\{/.test(dir)) {
                var m = dir.match(/([^\{]+|\{[^\}]+\})/gm), l = m.length;
                for (i = 0; i < l; i++) {
                    v = m[i];
                    if (v.charAt(0) == '{') {
                        m[i] = this[v.substr(1, v.length-2)] || v;
                    }
                }
                dir = m.join("");
            }
            return dir;
        },
        "_dir": function () {
            var self = this,
                context = self.ctx,
                pn = self.packageName;
            return (self.base || context.info.dom)
                + (self.prod || pn == context.cfg.defaultPackage || self.base.indexOf("{fullname}") != -1
                    ? ""
                    : (pn + "/"));
        },
        "url!": function () {
            var self = this;
            return (self.dir
                + (self.prod ? self.packageName : self.name)
                + "." + self.format);
        },
        "entry!": function () {
            var self = this,
                registry = self.ctx.registry,
                dn = self.domainName,
                pn = self.packageName,
                r = registry[dn] || (registry[dn] = {}),
                p = r[pn] || (r[pn] = {}),
                n = self.name;
            if (p[n]) p[n].dir = self.dir;
            return p[n] || (p[n] = {rescue: function () {/*delete p[n];*/}, dir: self.dir});
        },
        toString: function () {
            var self = this;
            return self.domainName + ":" + self.packageName + "." + self.name;
        }
    });

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
        return function (loadCallback, dir) {
            if (entry.impl) return;
            var func, rescue;
            if (isFunction(loadCallback)) {
                func = function () {loadCallback(success);};
                rescue = function () {loadCallback("error");};
            } else {
                func = rescue = function () {};
            }
            implWrapper(context, entry, func);
            entry.dir = dir;
            entry.rescue = rescue;
            entry.removeElement = removeElement;
            entry.impl();
        };
    }

    function Processors() {}

    // -- The Public API -------------------------------------------------------

    extend(basicApi, {
        "use": function (assets) {
            return requireAssets(this, isArray(assets) ? assets : slice.call(arguments, 0), false);
        },
        "addComponent": function (selector, json) {
            var context = this;
            if (arguments.length == 1){
                json = selector; selector = new Path(context, "unknown");
            }
            registerFunctions(context, json, selector);
        },
        "define": function (componentPath, deps, factory) {
            if (isFunction(deps)) {
                factory = deps;
                deps = [];
            }
            this.addComponent(componentPath, {assets: deps, getResponder: factory});
        },
        "addProcessor": function (processorName, func) {
            var r = this.cfg.processors, p = r[processorName];
            if (!p) r[processorName] = new Processor(func);
        },
        "process": function (processorName) {
            process(this, processorName, slice.call(arguments, 1));
        },
        "modes": {DEV:2, PROD:1},
        "as": function (name) {
            if (!name) return name;
            return window[name] || (window[name] = new WillJS(name));
        },
        "configure": function (initConfig) {
            var self = this;
            self.configured = true;
            setup(self, initConfig);
            return self;
        },
        "postConfigure": function (initConfig) {
            var self = this;
            setup(self, initConfig, true);
            return self;
        },
        "dir": function (dir, relativePath) {
            if (!relativePath) {
                relativePath = dir;
                dir = this.info.dir;
            }
            dir += (/\/$/.test(dir) ? "" : "/");
            dir = newElement("script", {src: dir + relativePath}).src;
            dir = dir.replace(/%7[bB]/g, '{').replace(/%7[dD]/g, '}');
            return dir;
        },
        ":info!": function () {
            var context = this, info = context._info, elements, len, i,
                tinfo, src;
            if (!info) {
                elements = getElements("script");
                if (!jsId) jsId = "will";
                for(i = 0, len = elements.length; i < len; i++) {
                    tinfo = new Asset(elements[i]);
                    if (tinfo.id == jsId) {
                        src = tinfo.href;
                        context._info = info = {
                            href: src,
                            qs: tinfo.qs,
                            min: /\.min\.js/.test(src),
                            dir: (src = src.replace(/\/(?:will\/)*[^\/]+$/, "/will/")),
                            dom: src + "components/"
                        };
                        break;
                    }
                }
            }
            return info;
        }
    });
    extend(basicApi, "u", {
        hit: missingMethod,
        Processors: Processors,
        Processor: Processor,
        Path: Path,
        process: process,
        requireAssets: requireAssets,
        registerFunctions: registerFunctions,
        extend: extend
    });
    extend(WillJS.prototype, basicApi);

    // -- Config Methods -------------------------------------------------------

    function getConfig() {
        return {
            registry: {},
            cfg: extend(new Defaults(), {
                    "processors": new Processors(),
                    "postLoad": [],
                    "assetsList": {
                        "jquery": ["//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js?"]
                    },
                    "assetsTargetList": {js: {}, css: {}},
                    "domains": {
                        "local": {format:"js"}
                    },
                    "packages": {}
                })
        };
    }

    function Defaults() {}
    extend(Defaults.prototype, {
        "mode": basicApi.modes.DEV,
        "version": "1.8.2",
        "addDomain": function (domainName, urlPrefix, asJS, mode) {
            if (urlPrefix) urlPrefix = urlPrefix + (/\/$/.test(urlPrefix) ? "" : "/");
            this.domains[domainName] = {format:(isString(asJS) ? asJS : asJS ? "js" : "json"), domain: urlPrefix, mode: mode};
        },
        "addAssetsList": function (term) {
            if (! ASSET_TERM.test(term) ) {
                throw new Error("invalid term: " + term);
            }
            this.assetsList[term] = slice.call(arguments, 1);
        },
        "translateAssetTo": function (assetsTarget, assets) {
            if (isString(assets)) assets = assets.split(",");
            if (! isArray(assetsTarget) ) assetsTarget = [assetsTarget];
            var assetsTargetList = this.assetsTargetList
              , i = 0, len = assets.length
              , source
            ;
            assetsTargetList = assetsTargetList[/\.css/.test(assetsTarget[0]) ? "css" : "js"];
            for ( ; i < len; ) {
                source = assets[i++];
                if (assetsTarget.indexOf(source) == -1) {
                    assetsTargetList[source] = assetsTarget;
                }
            }
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

    Processors.prototype.loadDependenciesAndCall =
        new Processor(function (context, entry, args) {
            var self = this
              , cfg = context.cfg
              , assetsList = cfg.assetsList
              , assetsTargetList = cfg.assetsTargetList
              , debug = cfg.debug
              , asset
              , assets = entry.assets
              , dir = entry.dir
              , i, len
              , r
              , css
              , pre
              , pos
              , el
            ;
            if (assets.length) {
                if (ASSET_TERM.test(asset = assets[0])) {
                    if (isArray(asset = assetsList[asset])) {
                        for (i = 0, len = asset.length; i < len; i++) {
                            if (/\.css(?:[?#].*)?$/.test(asset[i])) {
                                if (/\^/.test(asset[i])) {
                                    delete entry.bottomCss;
                                    delete entry.lastCss;
                                }
                                break;
                            }
                        }
                        asset = asset.slice(0);
                        asset.splice(0, 0, 0, 1);
                        assets.splice.apply(assets, asset);
                    } else {
                        entry.rescue.apply(undefined, args);
                        return;
                    }
                }
                asset = new Asset(assets[0], dir);
                pre = asset.pre;
                pos = asset.pos;
                if (r = isLoaded(asset)) {
                    assets.shift();
                    if (r[0]) {
                        if (css = entry.lastCss) {
                            el = entry.bottomCss.nextSibling;
                            if (pre && cssOrder(css, r[1])) {
                                insertCss(r[1], css);
                            } else if (el && cssOrder(r[1], entry.bottomCss)) {
                                insertCss(r[1], el);
                            }
                        }
                        if (!(css && pre)) entry.bottomCss = r[1];
                        entry.lastCss = r[1];
                    }
                    while (assets.length && FALLBACK_ASSET_PATTERN.test(assets[0])) {
                        assets.shift();
                    }
                    entry.impl.apply(undefined, args);
                } else {
                    if (r = assetsTargetList[asset.css ? "css" : "js"][asset.id]) {
                        if (debug) debug("** skipping asset \"" + asset.href + "\"");
                        assets.splice.apply(assets, [0, 1].concat(r));
                        entry.impl.apply(undefined, args);
                        return;
                    } else {
                        if (debug) debug("** loading asset \"" + asset.href + "\"");
                    }
                    if (pos) {
                        r = getElements(asset.tn);
                        if ( (len = r.length) != 0 ) {
                            entry.lastCss = entry.bottomCss = r[len - 1];
                        }
                    }
                    loadDependency(context, asset, entry[pre ? "lastCss" : "bottomCss"], function (status, css) {
                        try {
                            if (assets.length > 1 && FALLBACK_ASSET_PATTERN.test(assets[1])) {
                                if (status === success) {
                                    do {
                                        assets.shift();
                                    } while (assets.length > 1 && FALLBACK_ASSET_PATTERN.test(assets[1]));
                                } else {
                                    assets[1] = assets[1].replace(/\|/, "");
                                    status = success;
                                }
                            }
                            if (status === success) {
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
        });

    // -- Initial Setup --------------------------------------------------------

    window[globalName] = will = new WillJS(globalName);
    setup(will);

    // -- On-Demand Methods ----------------------------------------------------

    basicApi.u.hit("loadComponent", "componentLoader.js");
    missingMethod.call(WillJS.prototype, "call", "callComponent.js", true);

})(window, "will", null);
