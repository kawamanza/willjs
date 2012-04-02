describe("WillJS API 'call' method", function () {
    it("should load firstComponent component", function () {
        runs(function () {
            willjs.call("firstComponent")("testing with Jasmine");
        });
        waitsFor(function () {
            return ("result" in willjs);
        }, "component not loaded", 500);
        runs(function () {
            expect(willjs.result).toBe("firstComponent executed with: testing with Jasmine");
        });
    }); // it should load firstComponent component */
});

describe("WillJS API 'use' method loading CSSs", function () {
    it("should directly load CSSs and organize CSS hierarchy", function () {
        var loadDone = false, returnStatus = "initial";
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
        var loadDone = false, returnStatus = "initial";
        runs(function () {
            willjs.use(
                "g.css",
                "^i.css"
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
            expect(getWillJSElements("link")).toHaveSources(
                "i.css",
                "g.css"
            );
        });
        // normalize CSS order (i -> g <=> g -> i)
        runs(function () {
            loadDone = false;
            willjs.use(
                "f.css",
                "h.css",
                "^g.css",
                "j.css",
                "^i.css"
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
            expect(getWillJSElements("link")).toHaveSources(
                "f.css",
                "g.css",
                "h.css",
                "i.css",
                "j.css"
            );
        });
    }); // it should load CSSs using '^' and organize CSS hierarchy */
});
