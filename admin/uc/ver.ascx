<%@ Control Language="C#" AutoEventWireup="true" CodeFile="ver.ascx.cs" Inherits="admin_uc_ver" %>

<h1>
                <a href="~/admin/index2.aspx" runat="server">
                    <asp:Image ID="LOGO" runat="server" Visible="false" /><asp:Literal ID="LOGO_ALT" runat="server" Text="後端管理系統"></asp:Literal>
                </a>
            </h1> 
<span class="version-txt hidden"><asp:Literal ID="ezwebVersion" runat="server"></asp:Literal></span>