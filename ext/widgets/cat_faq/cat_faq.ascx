<%@ Control Language="C#" AutoEventWireup="true" CodeFile="cat_faq.ascx.cs" Inherits="cat_faq" %>

<!--uc:wid_cat_faq-->
<div class="wid wid-faq">
    <div class="h3">
        <%=_t("常見問題")%>
        <button type="button" class="btn side-toggle" aria-label="次選單" title="常見問題選單">
            <span class="glyphicon glyphicon-chevron-down"></span>
            <span class="glyphicon glyphicon-chevron-up"></span>
        </button>
    </div>
    <div class="nav" itemscope="itemscope" itemtype="http://schema.org/SiteNavigationElement">
        <asp:Repeater ID="Repeater1" runat="server" OnItemDataBound="Repeater_ItemDataBound">
            <ItemTemplate>
                <li itemprop="name">
                    <a href="<%=u.WebRoot() %>page/faq/index.aspx?kind=<%#Eval("num") %>" itemprop="url"><%#Eval("kind") %></a>

                    <asp:Repeater ID="Repeater2" runat="server">
                        <HeaderTemplate>
                            <ul>
                        </HeaderTemplate>
                        <ItemTemplate>
                            <li itemprop="name">
                                <a href="<%=u.WebRoot() %>page/faq/index.aspx?kind=<%#Eval("num") %>" itemprop="url"><%#Eval("kind") %></a>
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
