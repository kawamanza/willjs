(function (window, globalName) {
    "use strict";
    var will, loadComponentLoaded = false, info;
    will = window[globalName];

    /**
     * Default AJAX component loader (uses jQuery if no other wrapper has been setted).
     *
     * @method loadComponent_jQuery
     * @param {WillJS} context WillJS object context
     * @param {String} url The URL of JSON/JSONP component to load
     * @param {Function} completeCallback The callback to receive the JSON
     * @protected
     */
    function loadComponent_jQuery(context, url, completeCallback) {
        var cache = (context.cfg.mode === will.modes.PROD),
            suffix = context.cfg.queryString,
            jsonp, done = false, debug = context.cfg.debug;
        if ( jsonp = /\.jsonp$/.test(url) ) {
            url = url.replace(/p$/, "");
        }
        if (typeof suffix === "function") {suffix = suffix(url);}
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


    will.u.loadComponent = function (context, url, completeCallback) {
        if (loadComponentLoaded) {
            completeCallback(500, "");
            return;
        }
        info = context.info;
        context.use(
            "//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js?",
            "|" + info.dir.replace(/\/will\/$/, "/") + "jquery.min.js" + (info.qs || "?")
        )(function (status) {
            if (status === "success") {
                context.u.loadComponent = loadComponent_jQuery;
                loadComponent_jQuery(context, url, completeCallback);
            } else {
                loadComponentLoaded = true;
                completeCallback(500, "");
            }
        });
    };
})(window, "will");