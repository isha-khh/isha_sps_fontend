<%@ Control Language="C#" AutoEventWireup="true" CodeFile="cat_about.ascx.cs" Inherits="cat_about" %>

<!--uc:wid_cat_about-->
<div class="wid wid-about">
    <div class="h3">
        <asp:Literal ID="Literal1" runat="server"></asp:Literal>
        <button type="button" class="btn side-toggle" aria-label="次選單" title="次選單">
            <span class="glyphicon glyphicon-chevron-down"></span>
            <span class="glyphicon glyphicon-chevron-up"></span>
        </button>
    </div>
    <div class="nav" itemscope="itemscope" itemtype="http://schema.org/SiteNavigationElement">
        <asp:Repeater ID="Repeater1" runat="server" OnItemDataBound="Repeater_ItemDataBound">
            <ItemTemplate>
                <li itemprop="name">
                       <asp:HyperLink ID="about" runat="server" itemprop="url"></asp:HyperLink>
                    <asp:Repeater ID="Repeater2" runat="server" OnItemDataBound="Repeater_ItemDataBound">
                        <HeaderTemplate>
                            <ul>
                        </HeaderTemplate>
                        <ItemTemplate>
                            <li itemprop="name">
                                  <asp:HyperLink ID="about" runat="server" itemprop="url"></asp:HyperLink>
                                <asp:Repeater ID="Repeater3" runat="server">
                                    <HeaderTemplate>
                                        <ul>
                                    </HeaderTemplate>
                                    <ItemTemplate>
                                        <li itemprop="name">   <asp:HyperLink ID="about" runat="server" itemprop="url"></asp:HyperLink></li>
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
