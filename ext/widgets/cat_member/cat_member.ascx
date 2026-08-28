<%@ Control Language="C#" AutoEventWireup="true" CodeFile="cat_member.ascx.cs" Inherits="wrp_widgets_cat_member" %>

<!--uc:wid_cat_member-->
<div class="wid wid-member">
    <div class="h3">
        <%=_t("會員專區")%>
        <button type="button" class="btn side-toggle" aria-label="次選單">
            <span class="glyphicon glyphicon-chevron-down"></span>
            <span class="glyphicon glyphicon-chevron-up"></span>
        </button>
    </div>

    <asp:MultiView ID="MultiView1" runat="server">
        <asp:View ID="View1" runat="server">
            <ul class="nav" itemscope="itemscope" itemtype="http://schema.org/SiteNavigationElement">
                <li itemprop="name"><a href="<%=u.WebRoot() %>page/member/login.aspx" itemprop="url"><%=_t("會員登入")%></a></li>
                <li itemprop="name"><a href="<%=u.WebRoot() %>page/member/register.aspx" itemprop="url"><%=_t("會員註冊")%></a></li>
                <li itemprop="name"><a href="<%=u.WebRoot() %>page/member/forget.aspx" itemprop="url"><%=_t("忘記密碼")%></a></li>
                <li itemprop="name" id="activeLi" runat="server" visible="false"><a href="<%=u.WebRoot() %>page/member/active.aspx" itemprop="url"><%=_t("補寄認證信")%></a></li>
                <li itemprop="name" id="orderLi" runat="server" visible="false"><a href="<%=u.WebRoot() %>page/member/order.aspx" itemprop="url"><%=_t("非會員訂單查詢")%></a></li>
            </ul>
        </asp:View>
        <asp:View ID="View2" runat="server">
            <ul class="nav" itemscope="itemscope" itemtype="http://schema.org/SiteNavigationElement">
                <li itemprop="name"><a href="<%=u.WebRoot() %>page/member/modify.aspx" itemprop="url"><%=_t("會員資料修改")%></a></li>
                <li itemprop="name"><a href="<%=u.WebRoot() %>page/order/index.aspx" itemprop="url"><%=_t("訂單查詢")%></a></li>

                <li itemprop="name" id="bonusLi" runat="server"><a href="<%=u.WebRoot() %>page/member/bonus.aspx" itemprop="url"><%=_t("紅利查詢")%></a></li>
                <li itemprop="name" id="couponsLi" runat="server"><a href="<%=u.WebRoot() %>page/member/coupons.aspx" itemprop="url"><%=_t("折價券查詢")%></a></li>
                <li itemprop="name">
                    <asp:LinkButton ID="logout" runat="server" OnClick="logout_Click"><%=_t("會員登出")%></asp:LinkButton></li>
            </ul>
        </asp:View>
    </asp:MultiView>

</div>
