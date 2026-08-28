<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_products_list.ascx.cs" Inherits="home_new_products" %>
<!--uc:home_products_list_000-->
<div class="wid wid-home-product works-box" id="<%=this.ClientID%>">
    <div class="h2"><%=_t(BlockTitle) %></div>
    <ul class="txt-list list-unstyled list">
        <asp:Repeater ID="ProductRepeater" runat="server" OnItemDataBound="ProductRepeater_ItemDataBound">
            <ItemTemplate>
                <li class="list_item">
                    <asp:HyperLink ID="picWrap" runat="server" CssClass="pic" Visible="false">
                        <asp:Image ID="pic" runat="server" CssClass="img-fluid d-block mx-auto" Visible="false" />
                    </asp:HyperLink>
                    <asp:HyperLink ID="knidLink" runat="server" Visible="false" CssClass="kind"></asp:HyperLink>
                    <asp:HyperLink ID="itemLink" runat="server" CssClass="info">
                        <asp:Literal ID="subject" runat="server"></asp:Literal>
                        <asp:Literal ID="description" runat="server" Visible="false"></asp:Literal>
                        <asp:Literal ID="price" runat="server" Visible="false"></asp:Literal>
                    </asp:HyperLink>
                </li>
            </ItemTemplate>
        </asp:Repeater>
    </ul>
    <!-- /.txt-list -->
    <asp:HyperLink ID="btnMore" runat="server" CssClass="btn-more"></asp:HyperLink>
</div>
<!-- /.wid-home-product -->
