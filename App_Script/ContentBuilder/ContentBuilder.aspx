<%@ Page Language="C#" AutoEventWireup="true" CodeFile="ContentBuilder.aspx.cs" Inherits="App_Script_ContentBuilder_ContentBuilder" %>
<%@ Register Src="~/admin/uc/header.ascx" TagPrefix="uc1" TagName="header" %>
<!DOCTYPE HTML>
<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <meta charset="utf-8">
    <title>閃電編輯器 - Bootstrap ContentBuilder</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">  
    <link rel="shortcut icon" href="~/ezweb/admin/ckeditor/plugins/ContentBuilder/icons/ContentBuilder.png" type="image/png"/> 

    <!-- Bootstrap -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
    <script src="../jquery-1.12.4.min.js"></script>
    <link href="assets/minimalist-blocks/content.css" rel="stylesheet" type="text/css" />
    <link href="contentbuilder/contentbuilder.css" rel="stylesheet" type="text/css" />

    <style>
        .container {margin: 140px auto; /*max-width: 800px;*/ width:100%; /*padding:0 35px;*/ box-sizing: border-box;}
        #button button{
            min-width: 135px;
            height: 50px;
            line-height: 1;
            display: inline-block;
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            cursor: pointer;
            background-color: #f7f7f7;
            color: #4a4a4a;
            border: 1px solid transparent;
            font-family: sans-serif;
            letter-spacing: 1px;
            font-size: 13px;
            font-weight: normal;
            text-transform: uppercase;
            text-align: center;
            position: relative;
            border-radius: 0;
            transition: all ease 0.3s;
            user-select: none;
            white-space: normal;
            vertical-align: middle;
            line-height: 50px;
        }
        #button button:hover {
            background: #EEE;
        }
        #button button>img{
            height:20px;
            margin-right: 6px;
        }
    </style>
    <script>
        let web_root ='<%=web_root%>';
    </script>
    <uc1:header runat="server" ID="header" />
</head>
<body>
    <form id="form1" runat="server">
        <div>
        </div>
    </form>
    <script type="text/javascript">
        window.onload = function () {
            $('.container')[0].insertAdjacentHTML('beforeend', window.opener.CKEDITOR.instances[new URL(location.href).searchParams.get('editor')].getData());

            builder.applyBehavior();
            builder.opts.onChange();
            builder.opts.onRender();
        }

        function closeWindow(b) {
            if (b) {
                if ($('[data-filename]').length > 0) {

                    var formData = new FormData();
                    [].slice.call($('[data-filename]')).forEach(function (item, index, array) {
                        if (item.getAttribute("data-filename") != null) {
                            let dataUrl = item.src.split(',')
                            let base64 = dataUrl[1];
                            var fileName = item.getAttribute("data-filename");
                            var imgfile = convertBase64UrlToImgFile(base64, fileName, 'image/*');
                            formData.append('file', imgfile, fileName);
                        }
                    });

                    $.ajax({
                        asynce: false,
                        url: "upload.aspx",
                        type: "POST",
                        cache: false,
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (data) {
                            [].slice.call($('[data-filename]')).forEach(function (item, index, array) {
                                item.src = web_root + "upload/edit/" + item.getAttribute("data-filename");//.split('.')[0] + ".jpg";
                                item.removeAttribute("data-filename")
                            });

                            setTimeout(function () {
                                window.opener.CKEDITOR.instances[new URL(location.href).searchParams.get('editor')].setData(builder.html());
                                window.close();
                                window.opener.focus();
                            }, 100);
                        },
                        error: function (data) {
                            msgtop('上傳圖片失敗', 'error');
                        }
                    });
                }
                else {
                    window.opener.CKEDITOR.instances[new URL(location.href).searchParams.get('editor')].setData(builder.html());
                    window.close();
                    window.opener.focus();
                }

            }
            else {
                window.close();
                window.opener.focus();
            }
        }

        function convertBase64UrlToImgFile(urlData,fileName,fileType) {
            var bytes = window.atob(urlData); //转换为byte
            //处理异常,将ascii码小于0的转换为大于0
            var ab = new ArrayBuffer(bytes.length);
            var ia = new Int8Array(ab);
            var i;
            for (i = 0; i < bytes.length; i++) {
                ia[i] = bytes.charCodeAt(i);
            }
            //转换成文件，添加文件的type，name，lastModifiedDate属性
            var blob=new Blob([ab], {type:fileType});
            blob.lastModifiedDate = new Date();
            blob.name = fileName;
            return blob;
        }
/**/</script>

    <div class="container">

    </div>
    <div id="button" style="position: fixed; top: 0; left: 0;">
        <button type="button" id="btn_ok" onclick="closeWindow(true)" title="確定"><img src="check2.svg" />確定</button>
        <button type="button" id="btn_cancel" onclick="closeWindow(false)" title="取消"><img src="cross2.svg" />取消</button>
    </div>
    <script src="contentbuilder/contentbuilder.js" type="text/javascript"></script>
    <script src="assets/minimalist-blocks/content.js" type="text/javascript"></script>
    <script src="contentbuilder/lang/zh-tw.js" type="text/javascript"></script>
    <script>
        var snippetCategories = [
            [120, "基本"],
            [118, "文章"],
            [101, "標題"],
            [119, "按鈕"],
            [102, "相片"],
            [103, "圖文區塊"],
            [116, "聯絡資訊"],
            [104, "商品"],
            [105, "特色"],
            [106, "流程"],
            [107, "價格"],
            [108, "技能"],
            [109, "成就"],
            [110, "引言"],
            [111, "合作伙伴"],
            [112, "相關資訊"],
            [113, "錯誤畫面"],
            [114, "建置中"],
            [115, "說明"],
            //[999, "送出 Send"]
        ];
        var builder = new ContentBuilder({
            container: '.container',
            snippetOpen: true,
            row: 'row',
            cols: ['col-md-1', 'col-md-2', 'col-md-3', 'col-md-4', 'col-md-5', 'col-md-6', 'col-md-7', 'col-md-8', 'col-md-9', 'col-md-10', 'col-md-11', 'col-md-12'],
            clearPreferences: true,
            snippetCategories: snippetCategories
        });
    </script>

</body>
</html>
<%-- 
應修正項目:

----
e.opts.emailSnippetCategories
e.opts.snippetCategories
To get HTML:

    var html = builder.html();
--%>
