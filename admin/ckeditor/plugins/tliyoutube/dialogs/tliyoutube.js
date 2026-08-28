/**
 * @license Modifica e usa come vuoi
 *
 * Creato da TurboLab.it - 01/01/2014 (buon anno!)
 */
CKEDITOR.dialog.add( 'tliyoutubeDialog', function( editor ) {

    return {
        title: 'Youtube',
        minWidth: 400,
        minHeight: 75,
        contents: [
            {
                id: 'tab-basic',
                label: 'Basic Settings',
                elements: [
                    {
                        type: 'text',
                        id: 'youtubeURL',
                        label: '請輸入Youtube的網址：'
                    }
                    /*					
                 	,
					{
						 id: 'width',
						 type: 'text',
						 label: '請輸入寬度',
						 style: 'width:150px;height:30px',
						 'default': '530'
					 }
					 ,
					 {
						 id: 'height',
						 type: 'text',
						 label: '請輸入高度',
						 style: 'width:150px;height:30px',
						 'default': '315'
					 }*/
                ]
            }
        ],
        onOk: function() {
            var dialog = this;
			var url=dialog.getValueOf( 'tab-basic', 'youtubeURL');
			//var width=dialog.getValueOf( 'tab-basic', 'width');
			//var height=dialog.getValueOf( 'tab-basic', 'height');
			var regExURL=/v=([^&$]+)/i;
			var id_video=url.match(regExURL);
			
			if(id_video==null || id_video=='' || id_video[0]=='' || id_video[1]=='')
				{
				alert("輸入錯誤! \n例：http://www.youtube.com/watch?v=abcdef");
				return false;
				}

            /*
				if(width==null || width=='' || isNaN(width))
				{
					alert("請輸入寬度");
					return false;
				}
				if(height==null || height=='' || isNaN(height))
				{
					alert("請輸入高度");
					return false;
            }
            */
                      
            var div = editor.document.createElement('div');
            div.setAttribute('class', 'embed-responsive embed-responsive-16by9');
            var youtubeObject = '<iframe src="//www.youtube.com/embed/' + id_video[1] + '?rel=0" frameborder="0" allowfullscreen="1" />';         
            div.setHtml(youtubeObject);
            editor.insertElement(div);

            /*
            var oTag = editor.document.createElement( 'iframe' );			
            oTag.setAttribute( 'width', width );
			oTag.setAttribute( 'height', height );
			oTag.setAttribute( 'src', '//www.youtube.com/embed/' + id_video[1] + '?rel=0');
			oTag.setAttribute( 'frameborder', '0' );
            oTag.setAttribute('allowfullscreen', '1');        
           editor.insertElement(oTag);
           */
        
        }
    };
});