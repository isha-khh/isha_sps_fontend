/**
 * @license Modifica e usa come vuoi
 *
 * Creato da TurboLab.it - 01/01/2014 (buon anno!)
 */
CKEDITOR.plugins.add('EzTemplates', {
    icons: 'EzTemplates',
    init: function( editor ) {
        editor.addCommand('EzTemplatesDialog', new CKEDITOR.dialogCommand('EzTemplatesDialog'));
        editor.ui.addButton('EzTemplates', {
            label: 'EzTemplates',
            command: 'EzTemplatesDialog',
            toolbar: 'EzTemplates'
        });

        CKEDITOR.dialog.add('EzTemplatesDialog', this.path + 'dialogs/EzTemplates.js');

        //--------ez ¼ËªO

        jQuery.extend({
            getKind: function () {
                var result = null;
                $.ajax({
                    url: '../../ext/editor_templates/config.json',
                    type: 'get',
                    dataType: 'json',
                    async: false,
                    success: function (data) {
                        result = data;
                    }, error: function (data) {
                        result = "";
                    }
                });
                return result;
            },
            getList: function (kind) {
                var result = null;
                $.ajax({
                    url: '../../ext/editor_templates/extlist.json.aspx?kind=' + kind,
                    type: 'get',
                    dataType: 'json',
                    async: false,
                    success: function (data) {
                        result = data;
                    }, error: function (data) {
                        result = "";
                    }
                });                
                return result;
            },
            setList: function (result) {
                if (result) result = result.list
                CKEDITOR.addTemplates('ez_default', {
                    imagesPath: CKEDITOR.getUrl('../../'),
                    templates: result
                });
            },
            setKinds: function (results) {
                var item = "";
                results.forEach(function (element, index, array) {
                    item += '<option value="' + element.kind + '">' + element.title + "</option>";
                });
                return item;
            }
        });

        $.setList($.getList($.getKind()[0].kind))
    }
});
