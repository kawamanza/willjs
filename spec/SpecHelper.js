var specSuffix = new Date().getTime().toString(),
    reSuffix = new RegExp("\\?"+specSuffix, "g");
beforeEach(function() {
    this.addMatchers({
        toHaveSources: function () {
            var list = this.actual, sources = arguments,
                node, i, len = list.length;
            expect(len).toBe(sources.length, "not the same number of elements found");
            for(i = 0; i < len; i++) {
                node = list[i];
                expect(node.getAttribute("href").replace(reSuffix, "")).toBe(sources[i], "at the position " + i);
            }
            return true;
        }
    });
    resetWillJS();
});

function resetWillJS() {
    removeWillJSElements();
    if (window.willjs) delete window.willjs;
    window.will.as("willjs").configure(function (config) {
        config.addDomain("local", will.info.dir.replace(/\/source\/.*$/, "/spec/components"));
        config.queryString = function (url) {if (!/^\/\/ajax\.google/.test(url)) return specSuffix;};
        config.debug = function (msg) {
            config.debug.history.push(msg.replace(reSuffix, ""));
            if (console && console.log) console.log(msg);
        };
        config.debug.history = [];
    });
}

function removeWillJSElements(list) {
    var i, len, node, id;
    if (list) {
        if (typeof list == "string") list = getWillJSElements(list);
        for(i = 0, len = list.length; i < len; i++) {
            node = list[i];
            if ((id = node.getAttribute("data-willjs-id")) == null) continue;
            if (id == "jquery") {
                node.removeAttribute("data-willjs-id");
                continue;
            }
            if (node.parentNode) node.parentNode.removeChild(node);
        }
    } else {
        removeWillJSElements("link");
        removeWillJSElements("script");
    }
}

function getWillJSElements(tagName) {
    var list = [], elements, i, len;
    elements = document.getElementsByTagName(tagName);
    for(i = 0, len = elements.length; i < len; i++) {
        if (elements[i].getAttribute("data-willjs-id")) list.push(elements[i]);
    }
    return list;
}
