<%@ Control Language="C#" AutoEventWireup="true" CodeFile="seo.ascx.cs" Inherits="admin_uc_seo" %>

<div class="form-group">
    <label class="col-sm-3 col-md-2 control-label">
        <asp:Literal ID="_seoTitle" runat="server" Text="SEO設定"></asp:Literal></label>
    <div class="col-sm-9  col-md-10">
        <div style="padding-bottom: 5px">
            TITLE：<input type="text" class="form-control" id="title" runat="server" placeholder="" maxlength="100" />
        </div>
        <div style="padding-bottom: 5px">
            KEYWORD：<input type="text" class="form-control" id="keyword" runat="server" placeholder="" />
        </div>
        <div style="padding-bottom: 5px">
            DESCRIPTION：
            <asp:TextBox ID="description" runat="server" CssClass="form-control" TextMode="MultiLine" Rows="3"></asp:TextBox>
        </div>
        <asp:Panel ID="phc_Panel" runat="server">
            Head 嵌入碼：
            <asp:TextBox ID="page_head_code" runat="server" CssClass="form-control" TextMode="MultiLine" Rows="3" placeholder="要嵌入在Head標籤的碼，例如Google追蹤碼"></asp:TextBox>
        </asp:Panel>
        <asp:HiddenField ID="category" runat="server" />
        <asp:HiddenField ID="num" runat="server" />
    </div>
</div>
