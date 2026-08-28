<%@ Control Language="C#" AutoEventWireup="true" CodeFile="page_unit.ascx.cs" Inherits="ext_homewidgets_page_unit" %>
<!-- uc:page_unit -->
<div class="wid wid-page_unit">
    <div class="title h2" id="puNameBox" runat="server">
        <asp:Literal ID="puName" runat="server"></asp:Literal></div>
    <div class="pic" id="puPicBox" runat="server">
        <asp:Image ID="puPic" runat="server" /></div>
    <div class="editor">
        <asp:Literal ID="puWord" runat="server"></asp:Literal></div>
    <!-- /.page_unit -->
</div>
<!-- /.wid-page_unit -->

<%--
    # 單元頁面page_unit設定方式說明：
        1. 於後台"單元頁面管理"新增頁面，記下"流水號"並將設計好的html以純文字貼上送出
        2. 將此UC插入欲出現的頁面上，並設定PageNumber(流水號)參數；ex: PageNumber="15,43"
        3. puNameShow 設定頁面名稱是否顯示true/false (預設值:false)
        4. puPicShow 設定頁面圖片是否顯示true/false (預設值:false)
--%>