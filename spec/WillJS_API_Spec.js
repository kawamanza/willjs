describe("WillJS API 'call' method", function () {
    it("should load firstComponent component", function () {
        runs(function () {
            willjs.call("firstComponent")("testing with Jasmine");
        });
        waitsFor(function () {
            return ("result" in willjs);
        }, "component not loaded", 1000);
        runs(function () {
            expect(willjs.result).toBe("firstComponent executed with: testing with Jasmine");
            var h = willjs.cfg.debug.history;
            expect(h.length).toBe(2);
            expect(h[h.length -1]).toBe(" * successful loaded /spec/components/firstComponent.json");
        });
    }); // it should load firstComponent component */
});

describe("WillJS API 'use' method loading JSs", function () {
    it("should load all scripts", function () {
        var loadDone = false,
            h = willjs.cfg.debug.history,
            returnStatus = "initial";
        runs(function () {
            willjs.use(
                "/spec/fixture1.js",
                "/spec/fixture2.js"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "first JS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(2);
            expect(h[0]).toMatch(/\/fixture1.js"$/);
            expect(h[1]).toMatch(/\/fixture2.js"$/);
            expect(willjs.fixture1).toBe(true);
            expect(willjs.fixture2).toBe(true);
        });
    });
    it("should fail when scripts are not found", function () {
        var loadDone = false,
            h = willjs.cfg.debug.history,
            returnStatus = "initial";
        runs(function () {
            willjs.use(
                "/spec/test.js",
                "/spec/fixture1.js"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "first JS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("error");
            expect(h.length).toBe(1);
            expect(h[0]).toMatch(/\/test.js"$/);
        });
    });
    it("should load fallback scripts", function () {
        var loadDone = false,
            h = willjs.cfg.debug.history,
            returnStatus = "initial";
        runs(function () {
            willjs.use(
                "/spec/test.js",
                "|/spec/fixture1.js",
                "|/spec/test2.js",
                "|/spec/test3.js",
                "/spec/fixture2.js",
                "|/spec/test5.js",
                "|/spec/test4.js"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "first JS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(3);
            expect(h[0]).toMatch(/\/test.js"$/);
            expect(h[1]).toMatch(/\/fixture1.js"$/);
            expect(h[2]).toMatch(/\/fixture2.js"$/);
            expect(willjs.fixture1).toBe(true);
            expect(willjs.fixture2).toBe(true);
            loadDone = false;
            willjs.use(
                "/spec/fixture1.js",
                "|/spec/fixture2.js",
                "|/spec/test.js"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "first JS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
        });
    });
});

describe("WillJS API 'use' method loading CSSs", function () {
    it("should directly load CSSs and organize CSS hierarchy", function () {
        var loadDone = false,
            h = willjs.cfg.debug.history,
            returnStatus = "initial";
        runs(function () {
            willjs.use(
                "d.css",
                "b.css"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "first CSS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(2);
            expect(getWillJSElements("link")).toHaveSources(
                "d.css",
                "b.css"
            );
        });
        // normalize CSS order (d -> b <=> b -> d)
        runs(function () {
            loadDone = false;
            willjs.use(
                "a.css",
                "b.css",
                "c.css",
                "d.css",
                "e.css"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "second CSS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(5);
            expect(getWillJSElements("link")).toHaveSources(
                "a.css",
                "b.css",
                "c.css",
                "d.css",
                "e.css"
            );
        });
    }); // it should directly load CSSs and organize CSS hierarchy */

    it("should load CSSs using '^' and organize CSS hierarchy", function () {
        var loadDone = false,
            h = willjs.cfg.debug.history,
            returnStatus = "initial";
        runs(function () {
            willjs.use(
                "g.css",
                "^j.css"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "first CSS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(2);
            expect(getWillJSElements("link")).toHaveSources(
                "j.css",
                "g.css"
            );
        });
        // normalize CSS order (i -> g <=> g -> i)
        runs(function () {
            loadDone = false;
            willjs.use(
                "f.css",
                "i.css",
                "^h.css",
                "^g.css",
                "k.css",
                "^j.css"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "second CSS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(6);
            expect(getWillJSElements("link")).toHaveSources(
                "f.css",
                "g.css",
                "h.css",
                "i.css",
                "j.css",
                "k.css"
            );
        });
    }); // it should load CSSs using '^' and organize CSS hierarchy */

    it("should force CSS order", function () {
        var loadDone = false,
            h = willjs.cfg.debug.history,
            returnStatus = "initial";
        runs(function () {
            loadDone = false;
            willjs.use(
                "b.css",
                "d.css"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "second CSS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(2);
            expect(getWillJSElements("link")).toHaveSources(
                "b.css",
                "d.css"
            );
            loadDone = false;
            willjs.use(
                "a.css",
                "c.css"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "second CSS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(4);
            expect(getWillJSElements("link")).toHaveSources(
                "a.css",
                "c.css",
                "b.css",
                "d.css"
            );
            loadDone = false;
            willjs.use(
                "b.css",
                "c.css",
                "d.css",
                "e.css"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "second CSS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(5);
            expect(getWillJSElements("link")).toHaveSources(
                "a.css",
                "b.css",
                "c.css",
                "d.css",
                "e.css"
            );
            loadDone = false;
        });
    });

    it("should toggle CSSs", function () {
        var loadDone = false, elements,
            h = willjs.cfg.debug.history,
            returnStatus = "initial";
        runs(function () {
            loadDone = false;
            willjs.use(
                "aaa@b.css?keepqs=true"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "second CSS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(1);
            elements = getWillJSElements("link");
            expect(elements[0].getAttribute("data-willjs-id")).toBe("aaa");
            expect(elements).toHaveSources(
                "b.css?keepqs=true"
            );
            loadDone = false;
            willjs.use(
                "aaa@c.css"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            });
        });
        waitsFor(function () {
            return loadDone;
        }, "second CSS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(1);
            elements = getWillJSElements("link");
            expect(elements[0].getAttribute("data-willjs-id")).toBe("aaa");
            expect(elements).toHaveSources(
                "c.css?keepqs=true"
            );
        });
    });

    it("should load CSS from component's directory", function () {
        var loadDone = false, elements,
            h = willjs.cfg.debug.history;
        runs(function () {
            loadDone = false;
            willjs.addComponent("secondComponent", {
                impl: function () {loadDone = true;},
                rescue: function () {loadDone = true;},
                assets: [
                    "../../stylesheets/a.css",
                    "./b.css"
                ]
            });
            willjs.call("secondComponent")();
        });
        waitsFor(function () {
            return loadDone;
        }, "second CSS loading never completed", 200);
        runs(function () {
            expect(h.length).toBe(2);
            elements = getWillJSElements("link");
            expect(elements[0].href).toMatch(/\/stylesheets\/a.css\?/);
            expect(elements[1].href).toMatch(/\/spec\/components\/b.css\?/);
        });
    });
});
