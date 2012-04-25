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
});
