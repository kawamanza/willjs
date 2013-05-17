will.configure(function (config) {
    will.u.extend(config.domains.local, {
        format: "js"
      , mode: will.modes.DEV
    });
    config.debug = function (msg) { console.log(msg); };
});
