<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_contact_info.ascx.cs" Inherits="home_contact_info" %>
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

    <div class="editor">
        <div class="row">
            <div class="col-sm-4 text-center">
                <div><span class="glyphicon glyphicon-phone-alt"></span></div>
                <p><a href="tel:0422301313">客服電話</a></p>
                <p><a href="tel:0422386153">開店達人-服務專線</a></p>
                <p><a href="tel:0)22301313#131">線上購票-服務專線</a></p>
            </div>
            <div class="col-sm-4 text-center">
                <div><span class="glyphicon glyphicon-globe"></span></div>
                <p><a href="https://www.eztrust.com.tw" target="_blank">藝誠科技官網</a></p>
                <p><a href="http://www.oo.com.tw" target="_blank">開店達人</a></p>
            </div>
            <div class="col-sm-4 text-center">
                <div><span class="glyphicon glyphicon-shopping-cart"></span></div>
                <p><a href="http://www.eztoplay.com.tw" target="_blank">遊購網</a></p>
                <p><a href="http://www.oo.com.tw/myshop/ezgogo" target="_blank">EZGOGO購物網</a></p>
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
        </style>
    </div><!-- /.editor -->
</div><!-- /.wid-home-contact -->
