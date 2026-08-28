//Google QR-Code generator plugin by zmmaj from zmajsoft-team
//blah... version 1.1.
//problems? write to zmajsoft@zmajsoft.com

CKEDITOR.plugins.add( 'qrc',
{
	init: function( editor )
	{
		editor.addCommand( 'qrc', new CKEDITOR.dialogCommand( 'qrc' ) );
		editor.ui.addButton( 'qrc',
		{
			label: 'QR-Code',
			command: 'qrc',
			icon: this.path + 'images/qrc.png'
		} );
 
		CKEDITOR.dialog.add( 'qrc', function( editor )
		{
			return {
				title : 'QR-Code產生器',
				minWidth : 400,
				minHeight : 200,
				contents :
				[
					{
						id : 'qrc_general',
						label : 'QR Settings',
						elements :
						[
							{
								type : 'html',
								html : '請填寫下面資訊來協助您產生QR-Code'
							},
							{
								type : 'text',
								id : 'txt',
								label : '請輸入QR-Code的內容',
								validate : CKEDITOR.dialog.validate.notEmpty( '內容請勿空白' ),
								required : true,
								commit : function( data )
								{
									data.txt = this.getValue();
								}
							},
					
														{
								type : 'text',
								id : 'siz',
								label : '請輸入QR-Code的尺寸 ( 例： 300 ，請勿輸入超過500)',
								validate : CKEDITOR.dialog.validate.notEmpty( '尺寸請勿空白' ),
								required : true,
								commit : function( data )
								{
									data.siz= this.getValue();
								}
							},


		           	{
								type : 'html',
							html : '註：此產生器將透過Google提供的QR-Code服務來替您生成圖片'
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

					editor.insertHtml('<img src="https://chart.googleapis.com/chart?cht=qr&chs='+data.siz+'x'+data.siz+ '&chl='+data.txt+'&choe=UTF-8 &chld=H |4"/>');
				}
			};
		} );
	}
} );