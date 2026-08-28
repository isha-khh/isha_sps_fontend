/*
Copyright (c) 2003-2011, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/
var jsondata;
var templateArr = [];
$.ajax({
    async:false,
    dataType: "json",
    url: "../../ext/editor_templates/extlist.json.aspx",
    data: {},
    success: function (data) {
        jsondata = data;
        templateArr = data.list;
    }
});
CKEDITOR.addTemplates('ez_default', {
    imagesPath: CKEDITOR.getUrl('../../'),
    templates: templateArr
});

