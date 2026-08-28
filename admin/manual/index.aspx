<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="index.aspx.cs" ValidateRequest="false" Inherits="admin_manual_index" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" Runat="Server">

    <link href="../../App_Script/lightbox/css/lightbox.css" rel="stylesheet" />
    <script src="../../App_Script/lightbox/js/lightbox.min.js"></script>

    
</asp:Content>

<asp:Content ID="Content3" ContentPlaceHolderID="breadcrumb_holder" Runat="Server">
   <ol class="breadcrumb">
        <li><a href="../index2.aspx"><span class="ezicon ezicon-home"></span></a></li>        
        <li class="active">操作手冊</li>
    </ol>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder" Runat="Server">

      <div class="content_box">
   


              <%--<asp:Literal ID="word" runat="server"></asp:Literal>--%>


      </div><!-- /.content_box -->



    <!--UC:WRP_Widgets-->
<div class="content_box" id="manualDiv">
    <div id="manualPanel" class="panel panel-default form-horizontal information">
        <div class="panel-heading"><strong>操作手冊</strong></div>
        <div class="panel-body">
            <div class="manualContent">
                
            </div>
            <div>
                
            </div>
        </div>
    </div>
</div>

<script>
    $.ajax({
        url: '//www.wrp.com.tw/manual/api.ashx?part_no=' + getUrlVars()["part_no"] + '&chapter=' + getUrlVars()["chapter"] + '&mroot=' + getUrlVars()["mroot"],
        //url: 'http://www.wrp.com.tw/api/newsezclient.ashx',
        //url: 'http://www.wrp.com.tw/manual/api.ashx',
        type: 'GET',
       // dataType: 'xml',
        timeout: 2000,
        error: function (data) { //讀取失敗
            //closeDiv($("#manualDiv"));
            console.log(data);
            //var list = $(".manualContent");
            //list.html(data.responseText);
        },
        success: function (data) { //讀取成功
            var list = $(".manualContent");
            list.html(data);
            //list.html(htmlData);
            //$("#manualDiv .more_btn").attr("href", dataMore.find("link").text());
            //if (dataRow.length > 0) {
            //    dataRow.each(function (i) {
            //        var url = $(this).find("url").text(),
            //            uptime = $(this).find("uptime").text(),
            //            subject = $(this).find("subject").text(),
            //            kind = $(this).find("kind").text();
            //        list.append(newLi(url, uptime, subject));
            //    });
            //    setTimeout(function () { $(".manualContent").mCustomScrollbar("update"); }, 200);
            //} else {
            //    CloseDiv($("#manualDiv"));
            //}
        }
    });
    function closeDiv(DOM) { DOM.remove(); }
    function newLi(url, uptime, subject) {
        //var aTag = $("<span>").attr({ "href": url, "target": "_blank" }).text(subject),
        //    spanTag = $("<span>").text(uptime),
            liTag = $("<div>").append(subject);
        return liTag;
    }

    

    function getUrlVars() {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }

</script>

    
</asp:Content>




