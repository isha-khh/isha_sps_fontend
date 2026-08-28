<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_news_list.ascx.cs" Inherits="home_recent_news" %>
<!--uc:home_news_list_002-->
<div class="wid wid-home-news list-box" id="<%=this.ClientID%>">
    <div class="h2"><%=_t(BlockTitle) %></div>
    <div class="row clear_col list">
        <asp:Repeater ID="NewsRepeater" runat="server" OnItemDataBound="NewsRepeater_ItemDataBound">
            <ItemTemplate>
                <div class="<%=colClass%>">
                    <div class="list_item <%#(Eval("topping").ToString()=="Y")?"top":"" %>">
                        <div class="row">
                            <div class="col-sm-4">
                                <asp:HyperLink ID="picWrap" runat="server" CssClass="pic">
                                    <asp:Literal ID="movie" runat="server" ></asp:Literal>
                                    <asp:Image ID="pic" runat="server" CssClass="img-fluid d-block mx-auto" />
                                </asp:HyperLink>
                            </div>
                            <div class="col-sm-8">
                                <asp:HyperLink ID="knidLink" runat="server" Visible="false" CssClass="kind"></asp:HyperLink>
                                <asp:HyperLink ID="itemLink" runat="server" CssClass="info">
                                    <p class="title">
                                        <asp:Literal ID="subject" runat="server"></asp:Literal>
                                    </p>
                                    <small class="date">
                                        <asp:Literal ID="uptime" runat="server"></asp:Literal></small>
                                    <p class="desc">
                                        <asp:Literal ID="description" runat="server"></asp:Literal>
                                    </p>
                                </asp:HyperLink>
                            </div>
                        </div>
                    </div>
                </div>
            </ItemTemplate>
        </asp:Repeater>
    </div>
    <!-- /.row -->
    <asp:HyperLink ID="btnMore" runat="server" CssClass="btn-more"></asp:HyperLink>
</div>
<!-- /.wid-home-news -->
