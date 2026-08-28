<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_products_list.ascx.cs" Inherits="home_new_products" %>
<!--uc:home_products_list_001-->
<div class="wid wid-home-product works-box" id="<%=this.ClientID%>">
    <div class="h2"><%=_t(BlockTitle) %></div>
    <div class="row clear_col list">
        <asp:Repeater ID="ProductRepeater" runat="server" OnItemDataBound="ProductRepeater_ItemDataBound">
            <ItemTemplate>
                <div class="<%=colClass%>">
                    <div class="list_item">
                        <asp:HyperLink ID="picWrap" runat="server" CssClass="pic">
                            <asp:Image ID="pic" runat="server" CssClass="img-fluid d-block mx-auto" />
                        </asp:HyperLink>
                        <asp:HyperLink ID="knidLink" runat="server" Visible="false" CssClass="kind"></asp:HyperLink>
                        <asp:HyperLink ID="itemLink" runat="server" CssClass="info">
                            <p class="title">
                                <asp:Literal ID="subject" runat="server"></asp:Literal>
                            </p>
                            <p class="desc">
                                <asp:Literal ID="description" runat="server"></asp:Literal>
                            </p>
                            <p class="price">
                                <asp:Literal ID="price" runat="server"></asp:Literal>
                            </p>
                        </asp:HyperLink>
                    </div>
                </div>
            </ItemTemplate>
        </asp:Repeater>
    </div>
    <!-- /.row -->
    <asp:HyperLink ID="btnMore" runat="server" CssClass="btn-more"></asp:HyperLink>
</div>
<!-- /.wid-home-product -->
