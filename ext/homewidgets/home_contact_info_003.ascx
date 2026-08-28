<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_contact_info.ascx.cs" Inherits="home_contact_info" %>
<div class="row">
    <div class="editor col-md-8">
        <div class="row">
            <div class="col-md-4 col-sm-4">
                <h4>關於我們</h4>
                <ul class="nav">
                    <li><a href="#">公司簡介</a></li>
                    <li><a href="#">公司簡介</a></li>
                    <li><a href="#">公司簡介</a></li>
                    <li><a href="#">公司簡介</a></li>
                </ul>
            </div>
            <div class="col-md-4 col-sm-4">
                <h4>最新消息</h4>
                <ul class="nav">
                    <li><a href="#">公司簡介</a></li>
                    <li><a href="#">公司簡介</a></li>
                    <li><a href="#">公司簡介</a></li>
                    <li><a href="#">公司簡介</a></li>
                </ul>
            </div>
            <div class="col-md-4 col-sm-4">
                <h4>商品櫥窗</h4>
                <ul class="nav">
                    <li><a href="#">公司簡介</a></li>
                    <li><a href="#">公司簡介</a></li>
                    <li><a href="#">公司簡介</a></li>
                    <li><a href="#">公司簡介</a></li>
                </ul>
            </div>
        </div>
    </div><!-- /.editor -->
    <div class="col-md-4">
        <div class="wid wid-home-contact contact-box">
            <h2><%=_t("聯絡資訊") %></h2>
            <ul class="contact-info list-unstyled">
                <li class="tel"><asp:Literal ID="com_tel" runat="server"></asp:Literal></li>
                <li class="company"><asp:Literal ID="com_name" runat="server"></asp:Literal></li>
                <li class="fax"><asp:Literal ID="com_fax" runat="server"></asp:Literal></li>
                <li class="mail"><asp:Literal ID="com_mail" runat="server"></asp:Literal></li>
                <li class="bstime"><asp:Literal ID="com_bstime" runat="server"></asp:Literal></li>
                <li class="add"><asp:Literal ID="com_address" runat="server"></asp:Literal></li>        
            </ul><!-- /.contact-info -->

            <asp:Panel ID="com_more_box" runat="server" CssClass="editor">
                <asp:Literal ID="com_more" runat="server"></asp:Literal>
            </asp:Panel>

        </div><!-- /.wid-home-contact -->
    </div>
</div>
<style type="text/css">
    .wid-home-contact .editor {
        margin-top: 30px;
    }

    .wid-home-contact .editor .glyphicon {
        font-size: 65px;
        margin-bottom: 20px;
    }

    .footer_extra .editor .jumbotron {
        background-color: #333;
        color: #fff;
    }

    .footer_extra .editor .jumbotron h2 {
        font-size: 36px;
        color: #fff;
        margin-top: 0;
    }

    .footer_extra .editor .jumbotron h3 {
        color: #fff;
    }

    .footer_extra .editor .container .row {
        margin-top: 30px;
        margin-bottom: 30px;
    }

    .sitemap {
        display: none;
    }

    .siteinfo {
        display: none;
    }

    .powered {
        display: inline-block;
        margin-left: 20px;
    }
</style>
