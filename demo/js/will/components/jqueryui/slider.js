will.define(
    "jqueryui.slider"
  , [
        "//code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css?"
      , "//code.jquery.com/jquery-1.8.1.min.js?"
      , "|../../../libs/jquery-1.8.1.min.js?"
      , "//ajax.googleapis.com/ajax/libs/jqueryui/1/jquery-ui.min.js?"
    ]
  , function () {
        return function (selector) {
            $(selector).slider();
        };
    }
);