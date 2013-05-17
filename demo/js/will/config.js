will.configure(function (config) {
    config.debug = function (msg) {
        if ( window.console && console.log ) {
            console.log(msg);
        }
    };
});
