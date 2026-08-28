
CKEDITOR.plugins.add( 'googlemap', {
    icons: 'googlemap',
    init: function( editor ) {
        editor.addCommand( 'googlemapDialog', new CKEDITOR.dialogCommand( 'googlemapDialog' ) );
        editor.ui.addButton( 'googlemap', {
            label: 'GoogleMap',
            command: 'googlemapDialog',
            toolbar: 'paragraph'
        });

        CKEDITOR.dialog.add( 'googlemapDialog', this.path + 'dialogs/map.js' );
    }
});