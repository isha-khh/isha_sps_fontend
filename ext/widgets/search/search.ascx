<%@ Control Language="C#" AutoEventWireup="true" CodeFile="search.ascx.cs" Inherits="widgets_search" %>

<!--uc:wid_search-->
<asp:Panel ID="Panel1" runat="server" CssClass="wid wid-search" DefaultButton="searchButton">
    <div class="h3">
        <%=_t("產品搜尋") %>
    </div>
    <div class="form-inline">
        <div class="form-group w1 hide">
            <asp:DropDownList ID="kind" title="產品分類" runat="server" CssClass="form-control">
                <asp:ListItem Value="" Text="分類"></asp:ListItem>
            </asp:DropDownList>
        </div>
        <div class="form-group w2">
            <asp:TextBox ID="kw" title="產品搜尋" runat="server" CssClass="form-control" placeholder="請輸入關鍵字"></asp:TextBox>
            <asp:LinkButton ID="searchButton" CssClass="btn btn-primary" runat="server" OnClick="searchButton_Click"><%=_t("產品搜尋") %></asp:LinkButton>
        </div>
    </div>

</asp:Panel>
