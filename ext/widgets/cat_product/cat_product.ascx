<%@ Control Language="C#" AutoEventWireup="true" CodeFile="cat_product.ascx.cs" Inherits="widgets_cat_product" %>

<!--uc:wid_cat_product-->
<div class="wid wid-product">
    <div class="h3">
        <asp:Literal ID="Literal1" runat="server"></asp:Literal>
        <button type="button" class="btn side-toggle" aria-label="次選單">
            <span class="glyphicon glyphicon-chevron-down"></span>
            <span class="glyphicon glyphicon-chevron-up"></span>
        </button>
    </div>
    <div class="nav" itemscope="itemscope" itemtype="http://schema.org/SiteNavigationElement">
        <asp:Repeater ID="Repeater1" runat="server" OnItemDataBound="Repeater_ItemDataBound">
            <ItemTemplate>
                <li itemprop="name">
                    <a href="<%=u.WebRoot() %>page/product/p02.aspx?kind=<%#Eval("num") + (!f.isStrNull(Request["root"])?"&root=" + f.ValString(Request["root"]):"") %>" itemprop="url"><%#Eval("kind") %></a>
                    <asp:Repeater ID="Repeater2" runat="server" OnItemDataBound="Repeater_ItemDataBound">
                        <HeaderTemplate>
                            <ul>
                        </HeaderTemplate>
                        <ItemTemplate>
                            <li itemprop="name">
                                <a href="<%=u.WebRoot() %>page/product/p02.aspx?kind=<%#Eval("num") + (!f.isStrNull(Request["root"])?"&root=" + f.ValString(Request["root"]):"") %>" itemprop="url"><%#Eval("kind") %></a>

                                <asp:Repeater ID="Repeater3" runat="server">
                                    <HeaderTemplate>
                                        <ul>
                                    </HeaderTemplate>
                                    <ItemTemplate>
                                        <li itemprop="name"><a href="<%=u.WebRoot() %>page/product/p02.aspx?kind=<%#Eval("num") + (!f.isStrNull(Request["root"])?"&root=" + f.ValString(Request["root"]):"") %>" itemprop="url"><%#Eval("kind") %></a></li>
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

                </li>
            </ItemTemplate>
        </asp:Repeater>


    </div>
</div>
