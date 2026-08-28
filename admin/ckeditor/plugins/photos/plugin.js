//Google QR-Code generator plugin by zmmaj from zmajsoft-team
//blah... version 1.1.
//problems? write to zmajsoft@zmajsoft.com

CKEDITOR.plugins.add( 'photos',
{
	init: function( editor )
	{
		editor.addCommand( 'photos', new CKEDITOR.dialogCommand( 'photos' ) );
		editor.ui.addButton( 'photos',
		{
		    label: '圖片批次插入',
			command: 'photos',
			icon: this.path + 'images/photos_insert.png'
		} );
 
		CKEDITOR.dialog.add( 'photos', function( editor )
		{
			return {
				title : '圖片批次插入',
				minWidth : 400,
				minHeight : 200,
				contents :
				[
					{
						id : 'photos_general',
						label : 'Photos Settings',
						elements :
						[							
                           {
                               type: 'button',
                               hidden: true,
                               id: 'browse',
                               label: '開啟檔案上傳',
                               filebrowser: {
                                   action: 'Browse',
                                   target: "photos_general:txtUrl",
                                   url: "../fileupload/index.aspx"
                               }
                           },
                            {
                                type: 'textarea',
                                id: 'txtUrl',
                                label: '批次插入的清單：',
                                validate: CKEDITOR.dialog.validate.notEmpty('尚未選擇圖片'),
                                required: true,
                                commit: function (data) {
                                    data.txtUrl = this.getValue();
                                }
                            }
                           

						]
					}
				],			
				onOk : function()
				{
			var dialog = this,
						data = {},
						link = editor.document.createElement( 'a' );
					this.commitContent( data );

					var path = data.txtUrl.split('\n');
					for (i = 0; i < path.length; i++) {
					    editor.insertHtml('<img src="' + path[i] + '" />');
					}

					
				}
			};
		} );
	}
} );