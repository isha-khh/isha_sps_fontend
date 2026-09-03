ContentBuilder.js ver. 4.0.14


*** USAGE ***

1. Include:

	<link href="contentbuilder/contentbuilder.css" rel="stylesheet" type="text/css" />

	<script src="contentbuilder/contentbuilder.min.js" type="text/javascript"></script>
    
    <script src="assets/minimalist-blocks/content.js" type="text/javascript"></script> <!-- Snippets file -->

2. Run:

    var builder = new ContentBuilder({
        container: '.container',
    });

	Specify your editing area in container parameter.

3. To get HTML:

    var html = builder.html();

	
See example1.html for a basic implementation.


*** UPGRADING FROM ver. 3.x ***

The new ContentBuilder.js 4 is compatible with the previous version 3.x. The implementation doesn't change.
You can still using the jQuery implementation using the new ContentBuilder.js 4.
To upgrade, copy/merge contentbuilder/ and assets/ folder from the new version into your current implementation.


*** USING IN CSS FRAMEWORKS ***

If the framework has 12 columns grid system, specify row & columns classes using row & cols parameters. For example:

Bootstrap Framework

	TRY: example1-bootstrap.html

	Specify row & cols parameters as follows:

		var builder = new ContentBuilder({
			container: '.container',
			row: 'row',
			cols: ['col-md-1', 'col-md-2', 'col-md-3', 'col-md-4', 'col-md-5', 'col-md-6', 'col-md-7', 'col-md-8', 'col-md-9', 'col-md-10', 'col-md-11', 'col-md-12']            
		});
	

Foundation Framework

	TRY: example1-foundation.html
	
	Specify row & cols parameters as follows:

        var builder = new ContentBuilder({
            container: '.container',
            snippetOpen: true,
            row: 'row',
            cols: ['large-1 columns', 'large-2 columns', 'large-3 columns', 'large-4 columns', 'large-5 columns', 'large-6 columns', 'large-7 columns', 'large-8 columns', 'large-9 columns', 'large-10 columns', 'large-11 columns', 'large-12 columns']
        });

If the framework has grid system in which the column size increment is not constant, you'll need to specify two additional parameters:

	colequal: list of all class combinations that have same width

	colsizes: list of all class combinations in increment order

Here is an example:

UIKit Framework

	TRY: example1-uikit.html

	Specify row, cols, colequal & colsizes parameters as follows:

        var builder = new ContentBuilder({
            container: '.container',
            row: 'uk-grid',
            cols: ['uk-width-1-6@m', 'uk-width-1-5@m', 'uk-width-1-4@m', 'uk-width-1-3@m', 'uk-width-2-5@m', 'uk-width-1-2@m', 'uk-width-3-5@m', 'uk-width-2-3@m', 'uk-width-3-4@m', 'uk-width-4-5@m', 'uk-width-5-6@m', 'uk-width-1-1@m'],
            
            //the following parameters are needed for grid system in which the column size increment is not constant.
            colequal: [
	                ['uk-width-1-4@m', 'uk-width-1-4@m', 'uk-width-1-4@m', 'uk-width-1-4@m'],
	                ['uk-width-1-3@m', 'uk-width-1-3@m', 'uk-width-1-3@m'],
	                ['uk-width-1-2@m', 'uk-width-1-2@m']
            ],
            colsizes: [ 
                [   //increment for 3 columns
	                ['uk-width-1-5@m', 'uk-width-2-5@m', 'uk-width-2-5@m'],
	                ['uk-width-1-3@m', 'uk-width-1-3@m', 'uk-width-1-3@m'],
	                ['uk-width-2-5@m', 'uk-width-2-5@m', 'uk-width-1-5@m'],
	                ['uk-width-1-2@m', 'uk-width-1-4@m', 'uk-width-1-4@m'],
	                ['uk-width-3-5@m', 'uk-width-1-5@m', 'uk-width-1-5@m']
                ],
                [   //increment for 2 columns
	                ['uk-width-1-6@m', 'uk-width-5-6@m'],
	                ['uk-width-1-5@m', 'uk-width-4-5@m'],
	                ['uk-width-1-4@m', 'uk-width-3-4@m'],
	                ['uk-width-1-3@m', 'uk-width-2-3@m'],
	                ['uk-width-2-5@m', 'uk-width-3-5@m'],
	                ['uk-width-1-2@m', 'uk-width-1-2@m'],
	                ['uk-width-3-5@m', 'uk-width-2-5@m'],
	                ['uk-width-2-3@m', 'uk-width-1-3@m'],
	                ['uk-width-3-4@m', 'uk-width-1-4@m'],
	                ['uk-width-4-5@m', 'uk-width-1-5@m'],
	                ['uk-width-5-6@m', 'uk-width-1-6@m']
                ],
            ]            
        });

Note: 
- With the configuration explained above, all snippets/blocks are automatically converted into the framework's grid system.
  So there is no modification needed on the snippets.
- ContentBuilder.js may not always work on certain framework.
- Here are some examples on using in various css frameworks:

	- example1.html (without framework / use built in basic css)
	- example1-bootstrap.html (Bootstrap Example)
	- example1-foundation.html (Foundation Example)
	- example1-foundationxy.html (Foundation XY Grid Example)
	- example1-materializecss.html (Materialize Example)
	- example1-bulma.html (Bulma Example)
	- example1-uikit.html (UIKit Example)
	- example1-milligram.html (Milligram Example)
	- example1-material.html (Material Design Lite Example)
	- example1-skeleton.html (Skeleton Example)
	- example1-w3css.html (W3.CSS Example)
	- example1-spectre.html (Spectre.css Example)
	- example1-primer.html (Primer Example)
	- example1-purecss.html (Pure Css Example)
	- example1-mustardui.html (Mustard UI Example)
	- example1-minicss.html (Mini.css Example)



*** HOW TOs ***


SAVING EMBEDED BASE64 IMAGE AS FILE (IMPORTANT!)

	TRY: example2.php

    To save image files on the server you will need server side handler. We provide PHP & ASP.NET example.

    Use saveImages() method to save all embedded base64 images. Here is an example:

        builder.saveImages('saveimage.php', function(){

            console.log('images saved');

            // Then you can save the content here:

            var html = builder.html(); // Get content

            // Submit the html to the server for saving. For example, if you're using html form:
            
            document.querySelector('#inpHtml').value = html;
            document.querySelector('#btnPost').click();

        });
        
	Include the form for saving:

		<form id="form1" method="post" style="display:none">
			<input type="hidden" id="inpHtml" name="inpHtml" />
			<input type="submit" id="btnPost" value="submit" />
		</form>
		

HAVING MULTIPLE EDITABLE AREAS

	TRY: example3.html
	
	To get the HTML content for an instance:

        var html1 = builder.html(document.querySelector('#area1')); //Get 1st area content

        var html2 = builder.html(document.querySelector('#area2')); //Get 1st area contentarea


PROGRAMMATICALLY ADD EDITABLE AREA

	If your application wants to add an editable container programmatically, after adding the container, call applyBehavior() method:
		
        builder.applyBehavior();

	This will make the new container become editable.


ENABLE CUSTOM FILE & IMAGE SELECT

	In link dialog, you can enable a button to open your own custom dialog for selecting file or image.

	Configuration needed:

			var builder = new ContentBuilder({
				container: '.container', 
				imageselect: 'images.html',
				fileselect: 'files.html'
			});
			
		Please see images.html and files.html (included in this package) as a simple example. 
		Use selectImage() or selectFile() function as shown in the images.html and files.html to return a value to the link dialog.

		

CUSTOMIZING SNIPPETS (CONTENT BLOCKS)

	Snippet data is stored in a json file located in:

		assets/minimalist-blocks/content.js

	This json file is processed and displayed nicely by snippetlist.html, and it is specified by parameter snippetData:
	
		snippetData: 'assets/minimalist-blocks/snippetlist.html'
		
	To customize the snippets, open the content.js and make the changes. Here are some attributes you can use on the snippets:

	1) To make an image not replaceable, add data-fixed attribute to the <img> element, for example:

		<img src=".." data-fixed />

	2) To make a column not editable, add data-noedit attribute on the column, for example:

		<div class="row clearfix">
			<div class="column full" data-noedit>

			</div>
		</div>
		
	3) To make a column not editable and cannot be deleted, moved or duplicated, add data-protected attribute on the column, for example:

		<div class="row clearfix">
			<div class="column full" data-protected>

			</div>
		</div>

	4) You can put snippet folder not on its default location. Path adjustment will be needed using snippetPathReplace parameter, for example:

		var builder = new ContentBuilder({
			snippetPathReplace: ['assets/minimalist-blocks/', 'mycustomfolder/assets/minimalist-blocks/'],
			...
		});


INCLUDE LANGUAGE FILE

	With language file you can translate ContentBuilder.js interface into another language. To include the language file:

		<script src="contentbuilder/lang/en.js" type="text/javascript"></script>

	Here is the language file content as seen on lang/en.js:

		var _txt = new Array();
		_txt['Bold'] = 'Bold';
		_txt['Italic'] = 'Italic';
		...

	You can create your own language file (by copying/modifying the lang/en.js) and include it on the page where contentbuilder.js is included.
	This will automatically translate the ContentBuilder.js interface.


PLUGIN Development

    See: https://innovastudio.com/content-builder/plugin-development.aspx
    

CONFIGURATION FILE

    With configuration file, you can install plugins. Configuration file is located at:

    contentbuilder/config.js

    This file is loaded during the ContentBuilder.js initialization.

    Sample config.js content:

        _cb.settings.plugins = ['preview','wordcount', 'buttoneditor'];

    You can also install plugins without using config.js file. Please use 'plugins' parameter:

        <script>
            var builder = new ContentBuilder({
                container: '.container',
                plugins: ['preview','wordcount', 'buttoneditor']
            });
        </script>

    Ini this case, you can remove this line in config.js:

        _cb.settings.plugins = ['preview','wordcount', 'buttoneditor'];

    (or make config.js empty)


*** OPTIONS ***

- container
    Selector for editable area.

- snippetData
	Default value: 'assets/minimalist-blocks/snippetlist.html'
	Location of content block view/selection.

- scriptPath: 
    Default value: '' (means use default location)
    Path for configuration file (config.js) and plugins folder: plugins/
    Specify this parameter if you want to move the config.js file and the plugins/ folder into different location.

- pluginPath: 
    Default value: '' (means use default location)
    Path for plugins folder: plugins/
    Specify this parameter if you want to move the plugins/ folder anywhere else. This will overide scriptPath parameter.

- assetPath: 
    Default value: 'assets/'
    Specify this parameter if you want to move assets files into different location.

- fontAssetPath: 
    Default value: 'assets/fonts/'
    Specify this parameter if you want to move font image files from assets/fonts/ into different location.

- snippetPath
    Default value: '' (means use default location)
    Specify this parameter if you want to move snippets files from assets/minimalist-blocks/ into different location.

- largerImageHandler: 
    Default value: '' 
    Specify additional server side handler for uploading actual image.
    If specified, a browse icon will be displayed on image link dialog.
    We provide a PHP and ASP.NET example in the package. To try, here is an example setting:

        var builder = new ContentBuilder({
            container: '.container',
            largerImageHandler: 'saveimage-large.php' // or saveimage-large.ashx if you're using ASP.NET
        });    

    By default, image is saved in "uploads" folder. You can change the upload folder by editing the saveimage-large.php or saveimage-large.aspx. 
    Open the file and see commented line where you can change the upload folder.

    After successful upload, an image link will be displayed. 
    When you click 'Ok', an "is-lightbox" class is added to the image link. 
    This can be used, for example, if you have e a lightbox script (to open larger image in a lightbox window).

- sidePanel: 'right' | 'left'
	Default value: 'right'
	Placement of sidebar (snippet sidebar, element styles editor sidebar).

- snippetHandle: true | false
	Default value: true
	To show/hide snippet sidebar handle.

- snippetOpen: true | false
	Default value: false
	To show/hide snippet sidebar on first page load.

- snippetsSidebarDisplay: 'auto' | 'always'
	Default value: 'auto'
	If set 'always', the snippets sidebar will not auto close on content click. 
	
- columnTool: true | false
	Default value: true
	To show/hide column tool.

- elementTool: true | false
	Default value: true
	To show/hide element tool.

- imageEmbed: true | false
	Default value: true
	To enable/disable image embed feature.
	
- elementEditor: true | false
	Default value: true
	To enable/disable element styles editing feature.

- colors
	Default value: ["#ff8f00", "#ef6c00", "#d84315", "#c62828", "#58362f", "#37474f", "#353535",
                "#f9a825", "#9e9d24", "#558b2f", "#ad1457", "#6a1b9a", "#4527a0", "#616161",
                "#00b8c9", "#009666", "#2e7d32", "#0277bd", "#1565c0", "#283593", "#9e9e9e"]
	To specify custom color selection.

- customTags
	Default value: []
	Custom tags is commonly used in a CMS for adding dynamic element within the content (by replacing the tags in production).
	Example:

		var builder = new ContentBuilder({
			customTags: [["Contact Form", "{%CONTACT_FORM%}"],
				["My Plugin", "{%MY_PLUGIN%}"]],
			...
		});

- animateModal: true | false
	Default value: true
	To enable/disable animation when a modal dialog displayed.

- customval
	Default value: ''
	Custom paramater can be used to pass any value. The value will be passed when an image is submitted on the server for saving. 
	In a CMS application, you can pass (for example) a user id or session id, etc. On the server, image handler can use this value to decide where to save the image for each user.
	This is more of to your custom application.

- imageQuality
	Default value: 0.92
	To specify image embed quality.
	
- columnHtmlEditor: true | false
	Default value: true
	To show/hide HTML button on column tool

- rowHtmlEditor: true | false
	Default value: false
	To show/hide HTML button on row tool

- htmlSyntaxHighlighting: true | false
	Default value: false
	To enable/disable syntax highlighting HTML editor

- toolbar: 'top' | 'left' | 'right'
	Default value: 'top'
	To specify the editing toolbar placement

- toolbarDisplay: 'auto' | 'always'
	Default value: 'auto'
	To set editing toolbar visibility

- toolbarAddSnippetButton: true | false
	Default value: false
	To show/hide 'Add Snippet' button on the editing toolbar

- buttons
	Default value: ['bold', 'italic', 'underline', 'formatting', 'color', 'align', 'textsettings', 'createLink', 'tags', 'more' , '|', 'undo', 'redo'],  
    To configure rich text editor buttons.

- buttonsMore
	Default value: ['icon', 'image', '|', 'list', 'font', 'formatPara', '|', 'html', 'preferences'], 
	To configure buttons on 'More' popup. 

	The "More" button will be displayed only if it has popup with buttons.

	You can move some buttons from the toolbar into the popup. However, not all buttons can be moved. Only the non popup buttons, such as: 
	"createLink", "icon", "image", "removeFormat", "html", "addSnippet", "html" & "preferences"
	
	If you don't want to use the "More" button:

		var builder = new ContentBuilder({
			container: '.container',
			buttonsMore: []
		});

	and make sure that there is no buttons from installed plugins, by editing the config.js:

		_cb.settings.plugins = [];

- builderMode: '' | 'minimal' | 'clean'
	Default value: ''
	To set builder mode. 
	Minimal and clean mode simplify the builder interface (less visible buttons).

- rowcolOutline: true | false
	Default value: true
	Show/hide active row/column outline.

- snippetAddTool: true | false
	Default value: true
	Show/hide add snippet (+) orange line.

- outlineStyle: '' | 'grayoutline'
	Default value: '' (colored)
    To set outline color.
	
- elementSelection: true | false
	Default value: true.
	When enabled (set true), Pressing CTRL-A will select current element (not all elements).

- snippetCategories: 
	Default value: [
        [120,"Basic"],
        [118,"Article"],
        [101,"Headline"],
        [119,"Buttons"],
        [102,"Photos"],
        [103,"Profile"],
        [116,"Contact"],
        [104,"Products"],
        [105,"Features"],
        [106,"Process"],
        [107,"Pricing"],
        [108,"Skills"],
        [109,"Achievements"],
        [110,"Quotes"],
        [111,"Partners"],
        [112,"As Featured On"],
        [113,"Page Not Found"],
        [114,"Coming Soon"],
        [115,"Help, FAQ"]
        ]
	To configure snippets' categories.

- defaultSnippetCategory: 
	Default value: 120
	To specify default snippet category.
	
- emailSnippetCategories: 
	Default value: [
        [1,"Logo"],
        [14,"Call to Action"],
        [2,"Title"],
        [3,"Title, Subtitle"],
        [4,"Info, Title"],
        [7,"Paragraph"],
        [6,"Heading"],
        [8,"Buttons"],
        [9,"Callouts"],
        [10,"Images + Caption"],
        [12,"Images"],
        [13,"List"],
        [15,"Pricing"],
        [16,"Quotes"],
        [17,"Profile"],
        [18,"Contact Info"],
        [19,"Footer"],
        [20,"Separator"]
        ]
	To configure snippets' categories for email mode.
		
- defaultEmailSnippetCategory:
	Default value: 14
	To specify default snippet category for email mode. 

- outlineMode: '' | 'row'
	Default value: '' (outline will be applied on both row and column).
	If set 'row', outline will be applied on row only.
	 
- elementHighlight: true | false
	Default value: true
	To enable/disable active element highlight.
	
- rowTool: 'right' | 'left'
	Default value: 'right'
	To specify Row Tool position.

- toolStyle: '' | 'gray'
	Default value: '' (colored)
    To set tool color.
	
- clearPreferences: true | false
	Default value: false
	If set true, will clear the editing Preferences on page load.


*** EVENTS ***


- onRender
	Triggered when new snippet added (or content changed). If there are custom extensions/plugins within the content, re-init the plugins here.

- onChange
	Triggered when content changed.

- onImageBrowseClick
	Triggered when image browse icon is clicked.

- onImageSettingClick
	Triggered when image link icon is clicked.

- onImageSelectClick
	Triggered when custom image select button is clicked.
	If onImageSelectClick event is used, custom image select button will be displayed on the image link dialog.

- onFileSelectClick
	Triggered when custom file select button is clicked.
	If onFileSelectClick event is used, custom file select button will be displayed on the link dialog.

- onAdd(html)
	Triggered when a snippet (block) is added or dropped into content.
	You can use it to modify the snippet's HTML before it is added or dropped into content. Set the modified html as a return, for example:

        var builder = new ContentBuilder({
            container: '.container',
            onAdd: function (html) {
                html = html.replace('{custom tag}', 'your content');
                return html;
            }
        });

- onContentClick(event)
	Triggered when content is clicked.


*** METHODS ***

- html(element)
    To get HTML
    Parameter: element (optional), to specify specific instance of editable area.

- saveImages(handler, callback)
    To call server side handler to save all embedded base64 images to the server.

    Example:

    builder.saveImages('saveimage.php', function(){ 
        
        console.log('image saving done!');

    });

    Use saveimage.ashx if you're using ASP.NET.

- viewHtml()
	To view HTML source dialog

- viewConfig()
	To view preferences (editor configuration) dialog
	
- loadHtml(html)
	To load HTML at runtime.

- viewSnippets()
	To open snippet selection.

- destroy()
	To disable/destroy the plugin.

- pasteHtmlAtCaret(html)
	To insert HTML at cursor position.

- undo()
    Perform undo.

- redo()
    Perform redo.


*** EXAMPLES ***


- example1.html (basic)

- example2.php (saving example)

- example3.html (multiple instance example)


*** USING IN EMAIL BUILDING ***

Extra Blocks for email building using Foundation framework is included (assets/email-blocks/snippetlist.html).

See: example-email.html

Usage: 
	
	Please set emailMode and absolutePath parameters to true.

        var builder = new ContentBuilder({
            container: '#contentarea',
            snippetData: 'assets/email-blocks/snippetlist.html',
            rowFormat: '<div><table align="center" class="container float-center"><tbody><tr><td><table class="row"><tbody><tr>' +
                '</tr></tbody></table></td></tr></tbody></table></div>',
            cellFormat: '<th class="small-12 large-12 columns first last"><table><tbody><tr><th>' +
                '</th></tr></tbody></table></th>',
            customTags: [["First Name", "{%first_name%}"],
                ["Last Name", "{%last_name%}"],
                ["Email", "{%email%}"]],
            emailMode: true,
            absolutePath:true
        });

More about Foundation for Email framework: http://foundation.zurb.com/emails/getting-started.html

	

*** SUPPORT ***

Email us at: support@innovastudio.com



---- IMPORTANT NOTE : ---- 
Custom Development is beyond of our support scope. 
Our support doesn't cover custom integration into users' applications. It is users' responsibility.
 
Once you get the HTML content, then it is more of to user's custom application (eg. posting it to the server for saving into a file, database, etc).
Server side implementation is beyond of our support scope.
------------------------------------------
