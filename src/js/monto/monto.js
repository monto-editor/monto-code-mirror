(function (mod) {
    mod(CodeMirror);
})(function (CodeMirror) {
    'use strict';

    CodeMirror.defineMode('monto', function () {
        // get instance of editor
        var editor = $('.CodeMirror')[0].CodeMirror;
        var markers = [];
        var cursor;

        editor.on('cursorActivity', function (cm) {
            // always keep track of the current cursor position
            cursor = cm.getCursor();
        });

        editor.on('change', function (cm, change) {
            Source.refreshLineSizes(cm.getValue());
            Source.setMessageContents(cm.getValue());
            Source.send();
        });

        Sink.registerFunctionOnReceive(function (newProduct) {
            if (newProduct.product === 'tokens') {
                editor.operation(function () {
                    markers.forEach(function (marker) {
                        marker.clear();
                    });
                    var contents = JSON.parse(Sink.getTokens().contents);
                    contents.forEach(function (content) {
                        var pos = Source.convertMontoToCMPosWithLength({
                            offset: content.offset,
                            length: content.length
                        });
                        markers.push(editor.markText({line: pos.from.line, ch: pos.from.ch}, {
                            line: pos.to.line,
                            ch: pos.to.ch
                        }, {className: 'cm-' + content.category}));
                    });
                });
            } else if (newProduct.product === 'outline') {
                $('#outline').html(refreshOutline(JSON.parse(newProduct.contents).children));
            }
        });

        function refreshOutline(children) {
            if (typeof children === 'undefined' || children === null) {
                return '';
            }
            var outline = '<ul class="outline" compact>';
            children.forEach(function (child) {
                var pos = Source.convertMontoToCMPosWithLength(child.identifier);
                outline += '<li>' + child.description + " : " + editor.getRange(pos.from, pos.to) + refreshOutline(child.children) + '</li>';
            });
            outline += '</ul>';
            return outline;
        }

        return {
            token: function (stream) {
                stream.skipToEnd();
                return '';
            }
        };
    });
});