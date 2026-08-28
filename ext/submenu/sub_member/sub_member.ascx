<%@ Control Language="C#" AutoEventWireup="true" CodeFile="sub_member.ascx.cs" Inherits="ext_submenu_sub_member_sub_member" %>
<asp:MultiView ID="MultiView1" runat="server">
    <asp:View ID="View1" runat="server">
        <ul class="dropdown-menu <%#ulClassName%>">
            <li><a class="dropdown-item" href="<%=u.WebRoot("page/member/login.aspx") %>"><%=_t("會員登入")%></a></li>
            <li><a class="dropdown-item" href="<%=u.WebRoot("page/member/register.aspx") %>"><%=_t("會員註冊")%></a></li>
            <li><a class="dropdown-item" href="<%=u.WebRoot("page/member/forget.aspx") %>"><%=_t("忘記密碼")%></a></li>
            <li id="activeLi" runat="server" visible="false"><a class="dropdown-item" href="<%=u.WebRoot("page/member/active.aspx") %>"><%=_t("補寄認證信")%></a></li>
            <li id="orderLi" runat="server" visible="false"><a class="dropdown-item" href="<%=u.WebRoot("page/member/order.aspx") %>"><%=_t("非會員訂單查詢")%></a></li>
        </ul>
    </asp:View>
    <asp:View ID="View2" runat="server">
        <ul class="dropdown-menu <%#ulClassName%>">
            <li><a class="dropdown-item" href="<%=u.WebRoot("page/member/modify.aspx") %>"><%=_t("會員資料修改")%></a></li>
            <li><a class="dropdown-item" href="<%=u.WebRoot("page/order/index.aspx") %>"><%=_t("訂單查詢")%></a></li>
            <li><asp:LinkButton CssClass="dropdown-item" ID="logout" runat="server" OnClick="logout_Click"><%=_t("會員登出")%></asp:LinkButton></li>
        </ul>
    </asp:View>
</asp:MultiView>
