describe("WillJS object", function () {
    it("should directly load CSS in order", function () {
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
    }); // it should directly load CSS in order */

    it("should load CSS in order using '^'", function () {
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
    }); // it should load CSS in order using '^' */
});
