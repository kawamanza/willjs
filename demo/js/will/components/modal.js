/*
    will.call("modal")({
        title: "Confirmation message"
      , body: "Are you sure about that?"
      , onLoad: function (modalBodyElement){}
      , onYes: function (modalBodyElement) {}
    });
 */
will.define(
    "modal"

  , [
        "../../../css/bootstrap.min.css?"
      , "../../libs/handlebars.js?"
      , "//code.jquery.com/jquery-1.8.1.min.js?"
      , "|../../libs/jquery-1.8.1.min.js?"
      , "../../libs/bootstrap.min.js?"
    ]

  , function () {
        var templateText = ' \
            <div id="willjsModal" class="modal hide fade"> \
              <div class="modal-header"> \
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button> \
                <h3>{{title}}</h3> \
              </div> \
              <div class="modal-body"> \
              </div> \
              <div class="modal-footer"> \
                {{#if confirm}} \
                <a href="#" class="btn{{buttons.cancel.style}}" data-dismiss="modal" aria-hidden="true">{{buttons.cancel.text}}</a> \
                <a href="#" class="btn{{buttons.ok.style}} btn-primary">{{buttons.ok.text}}</a> \
                {{else}} \
                <a href="#" class="btn{{buttons.ok.style}}" data-dismiss="modal" aria-hidden="true">{{buttons.ok.text}}</a> \
                {{/if}} \
              </div> \
            </div>'
          , template = null
        ;

        return function (options) {
            var $modal = $("#willjsModal")
              , message = options.body
              , modalBody
              , buttons
            ;
            if (!template) {
                template = Handlebars.compile(templateText);
            }
            if ($modal.length) {
                $modal.remove();
            }
            if (typeof message == "string") {
                if (!/<[^\>]+>/.test(message)) message = "<p>" + message + "</p>";
            }
            options.confirm = (typeof options.onYes == "function");
            buttons = {
                "cancel": {"style": "", "text": "N\u00e3o"}
              , "ok": {"style": "", "text": (options.confirm ? "Sim" : "Fechar")}
            };
            if (options.buttons == "saveAndCancel") {
                buttons = {
                    "cancel": {"style": " btn-danger", "text": "Cancel"}
                  , "ok": {"style": " btn-success", "text": "Salvar"}
                };
            }
            options.buttons = buttons;
            $modal = $(template(options));
            modalBody = $modal.find(".modal-body");
            modalBody.append(options.body);
            if (options.onLoad) options.onLoad(modalBody);
            // $modal.appendTo("body");
            $modal.modal();
            $modal.on('hidden', function () { $(this).remove(); })
            $modal.find(".btn-primary").click(function (e) {
                var closeModal = true;
                if (options.confirm) closeModal = options.onYes(modalBody);
                if (closeModal !== false) {
                    $(this).closest("#willjsModal").modal('hide');
                }
            });
        };
    }
);
