
CKEDITOR.plugins.add('ContentBuilder', {
    icons: 'ContentBuilder',
    init: function (editor) {
        editor.addCommand('ContentBuilder', {
            exec: function (edt) {
                window.open('../../App_Script/ContentBuilder/ContentBuilder.aspx?editor=' + edt.name, 'ContentBuilder');
            }
        });
        editor.ui.addButton('ContentBuilder', {
            label: '閃電編輯器', // ContentBuilder
            command: 'ContentBuilder',
            toolbar: 'paragraph'
        });
    }
});