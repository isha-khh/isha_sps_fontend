<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_qa_list.ascx.cs" Inherits="home_qa" %>
<!--uc:home_qa_list_000-->
<div class="wid wid-home-qa list-box" id="<%=this.ClientID%>">
    <div class="h2"><%=_t(BlockTitle) %></div>
    <ul class="txt-list list-unstyled list">
        <asp:Repeater ID="QARepeater" runat="server" OnItemDataBound="QARepeater_ItemDataBound">
            <ItemTemplate>
                <li class="list_item">
                    <asp:HyperLink ID="picWrap" runat="server" CssClass="pic" Visible="false">
                        <asp:Image ID="pic" runat="server" CssClass="img-responsive center-block" Visible="false" />
                    </asp:HyperLink>
                    <asp:HyperLink ID="knidLink" runat="server" Visible="false" CssClass="kind"></asp:HyperLink>
                    <asp:HyperLink ID="itemLink" runat="server" CssClass="info">
                        <p class="title">
                            <asp:Literal ID="subject" runat="server"></asp:Literal>
                        </p>
                        <p class="desc">
                            <asp:Literal ID="description" runat="server"></asp:Literal>
                        </p>
                    </asp:HyperLink>
                </li>
            </ItemTemplate>
        </asp:Repeater>
    </ul>
    <!-- /.txt-list -->
    <asp:HyperLink ID="btnMore" runat="server" CssClass="btn-more"></asp:HyperLink>
</div>
<!-- /.wid-home-qa -->
