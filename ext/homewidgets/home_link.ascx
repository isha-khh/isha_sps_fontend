<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_link.ascx.cs" Inherits="home_recent_link" %>
<!-- uc:home_link -->




<div class="slider   wid-book   " data-aos="fade-up">
    <asp:Repeater ID="LinkRepeater" runat="server" OnItemDataBound="LinkRepeater_ItemDataBound">
        <ItemTemplate>
            <div class="card">
                <asp:HyperLink ID="LinkA" runat="server" CssClass="item d-block">
                    <div class="pic">
                        <asp:Image ID="LinkImg" runat="server" CssClass="img-fluid d-block mx-auto" />
                    </div>
                    <!--pic-->
                </asp:HyperLink>
                <!--item-->
            </div>
            <!--card-->
        </ItemTemplate>
    </asp:Repeater>
</div>
<!-- /. wid-book -->






