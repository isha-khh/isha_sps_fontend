<%@ Control Language="C#" AutoEventWireup="true" CodeFile="sub_page.ascx.cs" Inherits="ext_submenu_sub_page_sub_page" %>


<asp:Repeater ID="Repeater2" runat="server" OnItemDataBound="Repeater2_ItemDataBound">
    <HeaderTemplate>
        <ul class="dropdown-menu <%#ulClassName%>">
            <li class="subtitle" runat="server" visible="<%#sub_menu_title_visable%>"><a class="dropdown-item" href="<%#ResolveUrl(sub_menu_titleurl)%>"><%#sub_menu_title%></a></li>
    </HeaderTemplate>
    <ItemTemplate>
       <li class="dropdown dropend <%#liClassName%>">
            <asp:HyperLink CssClass="dropdown-item" ID="menu" runat="server"></asp:HyperLink>
            <asp:Repeater ID="Repeater3" runat="server" OnItemDataBound="Repeater3_ItemDataBound">
                <HeaderTemplate>
                    <ul class="dropdown-menu">
                </HeaderTemplate>
                <ItemTemplate>
                    <li>
                        <asp:HyperLink CssClass="dropdown-item" ID="menu" runat="server"></asp:HyperLink></li>
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
