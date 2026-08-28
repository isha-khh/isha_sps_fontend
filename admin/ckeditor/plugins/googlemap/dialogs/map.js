
CKEDITOR.dialog.add('googlemapDialog', function (editor) {
                
            return {                        
                title: '插入GoogleMap地圖',
                minWidth: 200,
                minHeight: 200,
                contents: [
                   {
                       id: 'GoogleMapControl',
                       label: '自訂插入GoogleMap工具',
                       title: '自訂插入GoogleMap工具',
                       elements:              
                           [ 						                          
                              
                           {
                               id: 'addr',
                               type: 'text',
                               label: '請輸入地址',
                               style: 'width:400px;height:30px',
                               'default': ''
                           } 
						   ,
						    {
                               id: 'nation',
                               type: 'text',
                               label: '請輸入語系碼',
                               style: 'width:150px;height:30px',
                               'default': 'zh-TW'
                           }                           
                           ,
                           {
                               id: 'width',
                               type: 'text',
                               label: '請輸入地圖寬度',
                               style: 'width:150px;height:30px',
                               'default': '425'
                           }
                           ,
                           {
                               id: 'height',
                               type: 'text',
                               label: '請輸入地圖高度',
                               style: 'width:150px;height:30px',
                               'default': '350'
                           }
                           ]
                   }
                   ],
                onOk: function () {
                            
					nation = this.getValueOf('GoogleMapControl', 'nation');		        
                    addr = this.getValueOf('GoogleMapControl', 'addr');
                    width = this.getValueOf('GoogleMapControl', 'width');
                    height = this.getValueOf('GoogleMapControl', 'height');
					
					
                 
				if(addr==null || addr=='')
				{
					alert("請輸入地址");
					return false;
				}
				if(nation==null || nation=='')
				{
					alert("請輸入語系碼");
					return false;
				}   
				if(width==null || width=='' || isNaN(width))
				{
					alert("請輸入地圖寬度");
					return false;
				}
				if(height==null || height=='' || isNaN(height))
				{
					alert("請輸入地圖高度");
					return false;
				}
										   
				var url = "https://maps.google.com.tw/maps?f=q&hl=" + nation + "&geocode=&q=" + encodeURI(addr) + "&z=16&output=embed&t="	
				var oTag = editor.document.createElement( 'iframe' );			
				oTag.setAttribute( 'width', width );
				oTag.setAttribute( 'height', height );
				oTag.setAttribute( 'frameborder', '0' );
				oTag.setAttribute( 'scrolling', 'no' );
				oTag.setAttribute( 'marginheight', '0' );
				oTag.setAttribute( 'marginwidth', '0' );
				oTag.setAttribute( 'src', url );					
				editor.insertElement( oTag );   
				   
				   
                    
                }
            };
        });   