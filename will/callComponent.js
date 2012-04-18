(function (window, globalName) {
    var will;
    will = window[globalName];
    will.constructor.prototype.call = function (compPath) {
        var context = this;
        return function () {
            context.u.process(context, "callComponent", [context, compPath, arguments]);
        };
    };
})(window, "will");
