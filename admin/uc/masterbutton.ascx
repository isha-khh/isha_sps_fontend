<%@ Control Language="C#" AutoEventWireup="true" CodeFile="masterbutton.ascx.cs" Inherits="admin_uc_masterbutton" %>

<button class="btn dropdown-toggle visible-xs" data-toggle="dropdown" type="button"><span class="ezicon ezicon-user"></span></button>
<a class="btn dropdown-toggle visible-xs" href="~/index.aspx" runat="server" target="_blank" ><span class="ezicon ezicon-global"></span></a>
<ul class="dropdown-menu" role="menu">
    <li class="b1"><a><span class="ezicon ezicon-user"></span> 帳號：<asp:Literal ID="u_id" runat="server"></asp:Literal></a></li>
                  
    <li class="b2"><asp:HyperLink ID="logout" runat="server" NavigateUrl="~/admin/index.aspx"><span class="ezicon ezicon-logout"></span> 登出</asp:HyperLink></li>                     
    <li class="b4"><asp:HyperLink ID="WrpWeb1" runat="server" Target="_blank"><span class="ezicon ezicon-wrp"></span> WRP專區</asp:HyperLink></li>
    <li class="b5"><a href="~/admin/item/setting.aspx" runat="server"><span class="ezicon ezicon-gear"></span> 設定</a></li>
</ul>

<ul class="list-inline nav-menu hidden-xs">
    <li><asp:HyperLink ID="wrpImportant" runat="server"></asp:HyperLink></li>
    <li class="b1"><a href="~/index.aspx" runat="server" target="_blank"><span class="ezicon ezicon-global"></span> <span class="txt">前台首頁</span></a></li>
    <li class="b1 hidden"><span class="ezicon ezicon-user"></span> <span class="txt">帳號：</span><asp:Literal ID="u_id2" runat="server"></asp:Literal></li>
                     
    <li class="b2"><asp:HyperLink ID="logout2" runat="server" NavigateUrl="~/admin/index.aspx" ToolTip="登出"><span class="ezicon ezicon-logout"></span><span class="txt"> 登出</span></asp:HyperLink></li>
    <li class="b4"><asp:HyperLink ID="WrpWeb2" runat="server" Target="_blank"><span class="ezicon ezicon-wrp" title="WRP專區"></span><span class="txt"> WRP專區</span></asp:HyperLink></li>
    <li class="b5"><a href="~/admin/item/setting.aspx" runat="server" title="設定"><span class="ezicon ezicon-gear"></span><span class="txt"> 設定</span></a></li>
</ul>