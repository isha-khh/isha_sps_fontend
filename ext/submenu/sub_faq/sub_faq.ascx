<%@ Control Language="C#" AutoEventWireup="true" CodeFile="sub_faq.ascx.cs" Inherits="ext_submenu_sub_faq_sub_faq" %>

<asp:Repeater ID="Repeater2" runat="server" OnItemDataBound="Repeater2_ItemDataBound">
    <HeaderTemplate>
       <ul class="dropdown-menu <%#ulClassName%>">
            <li class="subtitle" runat="server" visible="<%#sub_menu_title_visable%>"><a href="<%#ResolveUrl(sub_menu_titleurl)%>"><%#sub_menu_title%></a></li>
    </HeaderTemplate>
    <ItemTemplate>
       <li class="<%#liClassName%>">
            <asp:HyperLink ID="menu" runat="server"></asp:HyperLink>
            <asp:Repeater ID="Repeater3" runat="server" OnItemDataBound="Repeater3_ItemDataBound">
                <HeaderTemplate>
                    <ul>
                </HeaderTemplate>
                <ItemTemplate>
                    <li>
                        <asp:HyperLink ID="menu" runat="server"></asp:HyperLink></li>
                </ItemTemplate>
                <FooterTemplate>
                    </ul>
                </FooterTemplate>
            </asp:Repeater>
        </li>
    </ItemTemplate>
    <FooterTemplate>
        </ul>
    </FooterTemplate>
</asp:Repeater>
