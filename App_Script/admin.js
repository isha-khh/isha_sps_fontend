//後台

function checkAll(chk) {   
    $('.list-unstyled input:checkbox').each(function () {
        this.checked = chk;
    });
}

function checkListAll(chk) {   
    $('.listCheck input:checkbox').each(function () {
        this.checked = chk;
    });
}

function checkAll2(chk, num) {
    $('#root_' + num).show();
    $('#root_' + num + ' input:checkbox').each(function () {
        this.checked = chk;
    });
}

function loadingShow(obj) {  //ajax loading
    var position = $(obj).position();
    var ww = $(obj).outerWidth() / 2;
    var hh = $(obj).outerHeight() / 2;
    var w = $('#DivLoading').outerWidth() / 2;
    var h = $('#DivLoading').outerHeight() / 2;
    $('#DivLoading').css('left', (position.left + ww - w) + 'px');
    $('#DivLoading').css('top', (position.top - hh - h) + 'px');
}


function showPicBox(obj, div, n, path, w, h) {  //圖片預覽顯示

    if ($('#showPicBox' + n).length) {
        //do something
    } else {
        $('#' + div).append('<div id="showPicBox' + n + '" class="showPicBox" style="width:' + w + 'px; height:' + h + 'px"><img src="../../App_Script/DisplayCut.ashx?file=' + path + '&w=' + w + '&h=' + h + '" /></div>');
    }

    var position = $(obj).position();
    $('#showPicBox' + n).css('left', (position.left + obj.width) + 'px');
    $('#showPicBox' + n).css('top', (position.top + obj.height - h) + 'px');
    $('#showPicBox' + n).show();

}

function closePicBox(n) {    //圖片預覽關閉
    if ($('#showPicBox' + n).length) {
        $('#showPicBox' + n).hide();
    }
}

function PrintTagData(id) {

    if (isFirefox = navigator.userAgent.indexOf("Firefox") > 0) {
        window.print();
    } else {

        var Item = document.getElementById(id);
        var printdetail = window.open("", "TextareaDetail");
        printdetail.document.open();
        printdetail.document.write("<HTML><head>\n");
        printdetail.document.write('<link href="../../App_Script/bootstrap3/css/bootstrap.css" rel="stylesheet" />\n');
        printdetail.document.write('<link href="../../App_Script/bootstrap_datepicker/css/datepicker.css" rel="stylesheet" />\n');
        printdetail.document.write('<link href="../../admin/skin/css/style.css" rel="stylesheet" media="screen" />\n');
        printdetail.document.write('<link href="../../admin/skin/css/print.css" rel="stylesheet" media="print" />\n');
        printdetail.document.write('<!--[if lt IE 9]>\n');
        printdetail.document.write('<link href="../../admin/skin/css/ie8-and-down.css" rel="stylesheet" type="text/css" />\n');
        printdetail.document.write('<![endif]-->\n');

        printdetail.document.write("<style type=\"text/css\">.hidden-print{display:none;}</style>");
        printdetail.document.write("</head>");
        printdetail.document.write("<BODY onload=\"window.print();\">");
        printdetail.document.write(Item.outerHTML);
        printdetail.document.write("</BODY></HTML>");
        printdetail.document.close();

    }


}