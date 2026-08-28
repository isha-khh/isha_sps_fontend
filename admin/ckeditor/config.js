/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

/* 更多設定請參閱 :
 ckeditor3 : http://docs.cksource.com/ckeditor_api/symbols/CKEDITOR.config.html
 ckeditor4 : https://docs.ckeditor.com/ckeditor4/docs/#!/api/CKEDITOR.config
*/

CKEDITOR.editorConfig = function (config) {

    // config.uiColor = '#AADC6E';  //設定背景色	
    config.language = 'zh'; //語系中文   
    // config.skin = 'v2';   //佈景主題
    config.resize_enabled = false;  //設定不能resize TEXTAREA
    config.height = 300;    //設定高度
    config.enterMode = CKEDITOR.ENTER_BR;   //換行使用br，不使用p tag	
    config.image_prefillDimensions = false;   //插入圖片時，不自動帶寬高
    config.allowedContent = true;
    config.extraPlugins = 'ContentBuilder,blockimagepaste,tliyoutube,googlemap,qrc,lineheight,photos,EzTemplates';


    //為加入額外字體  
    config.font_names = 'Arial/Arial, Helvetica, sans-serif;Comic Sans MS/Comic Sans MS, cursive;Courier New/Courier New, Courier, monospace;Georgia/Georgia, serif;Lucida Sans Unicode/Lucida Sans Unicode, Lucida Grande, sans-serif;Tahoma/Tahoma, Geneva, sans-serif;Times New Roman/Times New Roman, Times, serif;Trebuchet MS/Trebuchet MS, Helvetica, sans-serif;Verdana/Verdana, Geneva, sans-serif;新細明體;標楷體;微軟正黑體';


    //功能列設定	
    config.toolbar_Default =
	[
        ['Source', '-', 'EzTemplates','ContentBuilder'],
		['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'],
		['Find', 'Replace', '-', 'SelectAll'],
		['Maximize', 'ShowBlocks', '-', 'About'],
		['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'],
		['NumberedList', 'BulletedList', 'Blockquote', '-', 'Outdent', 'Indent', '-',  'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
        ['Link', 'Unlink', 'Anchor'],
		['Image', 'photos', 'tliyoutube', 'googlemap', 'qrc', '-', 'Table', 'CreateDiv', 'Iframe', 'HorizontalRule', 'PageBreak', '-', 'Smiley', 'SpecialChar'],
        ['TextColor', 'BGColor'],
		['Styles', 'Format', 'Font', 'FontSize', 'LineHeight']
	];

    config.toolbar_Full =
	[
		['Source', '-', 'Save', 'NewPage', 'DocProps', 'Preview', 'Print', '-', 'Templates'],
		['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'],
		['Find', 'Replace', '-', 'SelectAll', '-', 'SpellChecker', 'Scayt'],
		['Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField'],
		['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'],
		['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', 'Iframe', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl'],
		['Link', 'Unlink', 'Anchor'],
		['Image', 'photos', 'Flash', 'tliyoutube', 'googlemap', 'qrc', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak'],
		['Styles', 'Format', 'Font', 'FontSize', 'LineHeight'],
		['TextColor', 'BGColor'],
		['Maximize', 'ShowBlocks', '-', 'About']
	];

    config.toolbar_Basic =
	[
        ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'],
        ['Maximize', 'ShowBlocks', 'Smiley', '-', 'About'],
		['Cut', '-', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'],
        ['Styles', 'Format', 'Font', 'FontSize', 'LineHeight'],
		['TextColor', 'BGColor']
	];

    config.toolbar_OnlyImg =
	[
        ['Image']
	];

    //config.toolbar = 'Default';  //指定要使用哪一個功能列設定

    //檔案管理器串接(不使用將設定註解掉即可)
    config.filebrowserImageBrowseUrl = '../filemanager/index.aspx';   //圖片用
    config.filebrowserFlashBrowseUrl = '../filemanager/index.aspx';	 //Flash用
    config.filebrowserBrowseUrl = '../filemanager/index.aspx';		 //超連結用

    //編輯器樣板
    config.bodyClass = 'editor';
    //config.templates_files = [
    //    '../ckeditor/plugins/templates/templates/ez_default.js',
    //    '../ckeditor/plugins/templates/templates/default.js'];
    //config.templates = 'ez_default,default';
    config.templates = 'ez_default';

    config.contentsCss = [
        '../../js/bootstrap-5.1.3-dist/css/bootstrap.min.css',
        '../../css/base.min.css',
        '../../css/bootstrap-col10.css',
        '../../css/base_rwd.min.css',
        '../../css/contentbuilder/editor_content.css',
        '../../App_Script/ContentBuilder/contentbuilder/contentbuilder.css'];

};

//編輯器內文 允許 a div , a p
CKEDITOR.dtd.a.div = 1;
CKEDITOR.dtd.a.p = 1;
CKEDITOR.dtd.a.h1 = 1;
CKEDITOR.dtd.a.h2 = 1;
CKEDITOR.dtd.a.h3 = 1;
CKEDITOR.dtd.a.h4 = 1;
CKEDITOR.dtd.a.h5 = 1;
CKEDITOR.dtd.a.h6 = 1;
CKEDITOR.dtd.a.ul = 1;
CKEDITOR.dtd.a.ol = 1;
CKEDITOR.dtd.a.li = 1;

//編輯器內文 允許 span , i 為空值
CKEDITOR.dtd.$removeEmpty.span = 0;
CKEDITOR.dtd.$removeEmpty.i = 0;

//插入範本 允許 link 在 div 內
CKEDITOR.dtd.div.link = 1;
