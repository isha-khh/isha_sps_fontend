<%@ Control Language="C#" AutoEventWireup="true" CodeFile="quickLink.ascx.cs" Inherits="widgets_quickLink" %>

<!--uc:wid_quickLink-->
<div class="wid wid-quickLink">
    <div class="h3">
        <%=_t("快速連結") %>
    </div>
    <ul class="nav">
        <asp:Repeater ID="LinkRepeater" runat="server" OnItemDataBound="LinkRepeater_ItemDataBound">
            <ItemTemplate>
                <li>
                    <asp:HyperLink ID="LinkA" runat="server" Target="_blank">
                        <asp:Image ID="LinkImg" runat="server" Width="100%" />
                    </asp:HyperLink></li>
            </ItemTemplate>
        </asp:Repeater>
    </ul>
</div>
