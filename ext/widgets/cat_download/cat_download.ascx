<%@ Control Language="C#" AutoEventWireup="true" CodeFile="cat_download.ascx.cs" Inherits="cat_download" %>

<!--uc:wid_cat_download 套程式 -->
<div class="wid wid-download  ">
    <div class="h3">
        <asp:Literal ID="Literal1" runat="server"></asp:Literal>
        <button type="button" class="btn side-toggle" aria-label="次選單" title="檔案下載選單">
            <span class="glyphicon glyphicon-chevron-down"></span>
            <span class="glyphicon glyphicon-chevron-up"></span>
        </button>
    </div>
    <div class="nav" itemscope="itemscope" itemtype="http://schema.org/SiteNavigationElement">
        <ul class="nav">
            <asp:Repeater ID="Repeater1" runat="server" OnItemDataBound="Repeater_ItemDataBound">
                <ItemTemplate>
                    <li itemprop="name">
                        <a href="<%=u.WebRoot() %>page/download/index.aspx?kind=<%#Eval("num") + (!f.isStrNull(Request["root"])?"&root=" + f.ValString(Request["root"]):"") %>" itemprop="url"><%#Eval("kind") %></a>

                        <asp:Repeater ID="Repeater2" runat="server">
                            <HeaderTemplate>
                                <ul>
                            </HeaderTemplate>
                            <ItemTemplate>
                                <li itemprop="name">
                                    <a href="<%=u.WebRoot() %>page/download/index.aspx?kind=<%#Eval("num")+ (!f.isStrNull(Request["root"])?"&root=" + f.ValString(Request["root"]):"") %>" itemprop="url"><%#Eval("kind") %></a>

                                </li>
                            </ItemTemplate>
                            <FooterTemplate>
                                </ul>
                   
                            </FooterTemplate>
                        </asp:Repeater>

                    </li>
                </ItemTemplate>
            </asp:Repeater>
        </ul>

    </div>
</div>
