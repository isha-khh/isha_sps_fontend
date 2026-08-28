<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_news_list.ascx.cs" Inherits="home_recent_news" %>
<!--uc:home_news_list_000-->
<div class="wid wid-home-news list-box" id="<%=this.ClientID%>">
    <div class="h2 "><%=_t(BlockTitle) %></div>
    <ul class="txt-list list-unstyled list">
        <asp:Repeater ID="NewsRepeater" runat="server" OnItemDataBound="NewsRepeater_ItemDataBound">
            <ItemTemplate>
                <li class="list_item <%#(Eval("topping").ToString()=="Y")?"top":"" %>">
                    <asp:HyperLink ID="picWrap" runat="server" CssClass="pic" Visible="false">
                        <asp:Literal ID="movie" runat="server" ></asp:Literal>
                        <asp:Image ID="pic" runat="server" CssClass="img-fluid center-block" Visible="false" />
                    </asp:HyperLink>
                    <asp:HyperLink ID="knidLink" runat="server" Visible="false" CssClass="kind"></asp:HyperLink>
                    <asp:HyperLink ID="itemLink" runat="server" CssClass="info">
                             <span class="date">
         <asp:Literal ID="uptime" runat="server"></asp:Literal></span>
                        <asp:Literal ID="subject" runat="server"></asp:Literal>
                   
                        <asp:Literal ID="description" runat="server" Visible="false"></asp:Literal>
                    </asp:HyperLink>
                </li>
            </ItemTemplate>
        </asp:Repeater>
    </ul>
    <!-- /.txt-list -->
    <asp:HyperLink ID="btnMore" runat="server" CssClass="btn-more"></asp:HyperLink>
</div>
<!-- /.wid-home-news -->
