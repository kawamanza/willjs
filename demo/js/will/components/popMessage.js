will.define(
    "popMessage"

  , []

  , function (message, options) {
        return function (message, options) {
            options || (options = {});
            options.body = message;
            if (!options.title) options.title = "Alerta";
            will.call("modal")(options);
        };
    }
);
