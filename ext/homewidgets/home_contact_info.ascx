<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_contact_info.ascx.cs" Inherits="home_contact_info" %>
<div class="wid wid-home-contact contact-box">
    <div class="h2"><%=_t(BlockTitle) %></div>
    <ul class="list-unstyled">
        <li class="tel"><asp:Literal ID="com_tel" runat="server"></asp:Literal></li>
        <li class="company"><asp:Literal ID="com_name" runat="server"></asp:Literal></li>
        <li class="fax"><asp:Literal ID="com_fax" runat="server"></asp:Literal></li>
        <li class="mail"><asp:Literal ID="com_mail" runat="server"></asp:Literal></li>
        <li class="bstime"><asp:Literal ID="com_bstime" runat="server"></asp:Literal></li>
        <li class="add"><asp:Literal ID="com_address" runat="server"></asp:Literal></li>        
    </ul>
    <asp:Panel ID="com_more_box" runat="server" CssClass="editor">
        <asp:Literal ID="com_more" runat="server"></asp:Literal>
    </asp:Panel>
</div>