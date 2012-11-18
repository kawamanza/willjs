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
            expect(h[h.length -1]).toMatch(/ \* successful loaded .*?\/spec\/components\/firstComponent\.json$/);
        });
    }); // it should load firstComponent component */
    it("should call 'getImpl' only when the first call occurs", function () {
        runs(function () {
            willjs.addComponent("myComponent",{
                getImpl: function(willjs) {
                    var entry = this;
                    this.times = (this.times || 0) + 1;
                    return function(value) {
                        entry.result || (entry.result = [])
                        entry.result.push(value);
                        willjs.performed = true;
                    }
                }
            });
            expect(willjs.registry.local.root.myComponent.times).toBe(undefined);
            expect(willjs.registry.local.root.myComponent.result).toBe(undefined);
            willjs.call("myComponent")("value 1");
        });
        waitsFor(function () {
            return ("performed" in willjs);
        }, "component not invoked", 1000);
        runs(function () {
            expect(willjs.registry.local.root.myComponent.times).toBe(1);
            expect(willjs.registry.local.root.myComponent.result[0]).toBe("value 1");
            delete willjs.performed;
            willjs.call("myComponent")("value 2");
        });
        waitsFor(function () {
            return ("performed" in willjs);
        }, "component not invoked", 1000);
        runs(function () {
            expect(willjs.registry.local.root.myComponent.times).toBe(1);
            expect(willjs.registry.local.root.myComponent.result[1]).toBe("value 2");
        });
    }); // it should call 'getImpl' only when the first call occurs */
});

describe("WillJS API 'use' method loading JSs", function () {
    it("should load all scripts", function () {
        var loadDone = false,
            h = willjs.cfg.debug.history,
            returnStatus = "initial";
        runs(function () {
            willjs.use(
                "../../spec/fixture1.js",
                "../../spec/fixture2.js"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            }, willjs.info.dir);
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
                "../../spec/test.js",
                "../../spec/fixture1.js"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            }, willjs.info.dir);
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
                "../../spec/test.js",
                "|../../spec/fixture1.js",
                "|../../spec/test2.js",
                "|../../spec/test3.js",
                "../../spec/fixture2.js",
                "|../../spec/test5.js",
                "|../../spec/test4.js"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            }, willjs.info.dir);
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
                "../../spec/fixture1.js",
                "|../../spec/fixture2.js",
                "|../../spec/test.js"
            )(function (status) {
                returnStatus = status;
                loadDone = true;
            }, willjs.info.dir);
        });
        waitsFor(function () {
            return loadDone;
        }, "first JS loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
        });
    });
    it("should load assets by mapped dependencies", function () {
        var loadDone = false
          ,  h = willjs.cfg.debug.history
          ,  returnStatus = "initial"
        ;
        runs(function () {
            willjs.use("fixtures")(function (status) {
                returnStatus = status;
                loadDone = true;
            }, willjs.info.dir);
        });
        waitsFor(function () {
            return loadDone;
        }, "loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("error");
            loadDone = false;
            willjs.cfg.addAssetsList("fixtures",
                "../../spec/fixture2.js",
                "../../spec/fixture1.js"
            );
            willjs.use("fixtures")(function (status) {
                returnStatus = status;
                loadDone = true;
            }, willjs.info.dir);
        });
        waitsFor(function () {
            return loadDone;
        }, "loading never completed", 200);
        runs(function () {
            expect(returnStatus).toBe("success");
            expect(h.length).toBe(2);
            expect(h[0]).toMatch(/\/fixture2.js"$/);
            expect(h[1]).toMatch(/\/fixture1.js"$/);
            expect(willjs.fixture1).toBe(true);
            expect(willjs.fixture2).toBe(true);
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
