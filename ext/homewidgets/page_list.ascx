<%@ Control Language="C#" AutoEventWireup="true" CodeFile="page_list.ascx.cs" Inherits="ext_homewidgets_page_list" %>
<!-- uc:page_list -->
<div class="page_unit2 wid wid-home-pages" id="<%=this.ClientID%>">
    <div class="h2"><%=_t(BlockTitle) %></div>
    <div class="slick list">
        <asp:Repeater ID="PagesRepeater" runat="server" OnItemDataBound="PagesItemDataBound">
            <ItemTemplate>
                <div class="list_item">
                    <asp:HyperLink ID="HyperLink1" runat="server">
                        <div class="pic">
                            <asp:Image ID="pic" runat="server" CssClass="img-responsive center-block" />
                        </div>
                        <div class="info">
                            <p class="title">
                                <asp:Literal ID="kind" runat="server"></asp:Literal>
                            </p>
                            <p class="desc">
                                <asp:Label ID="word" runat="server"></asp:Label>
                            </p>
                        </div>
                    </asp:HyperLink>
                </div>
            </ItemTemplate>
        </asp:Repeater>
    </div>
    <!-- /.slick -->
    <a href="<%=u.WebRoot()%>page/about/index.aspx?kind=<%=PageRoot%>" class="btn-more"><%=_t("查看更多") %></a>
</div>
<!-- /.page_unit2 -->
<%--
    # slidesCol 參數，各尺寸轉盤個數設定方式說明：
        1. 在頁面上已插入UC的上，加入 slidesCol="A,B,C,D,E" (預設值"4,3,2,1,1") 
        2. A=1200以上 ; B=1200~993 ; C=992~769 ; D=768~480 ; E=480以下
        3. 如所有尺寸均相同，設一組即可 EX: slidesCol="3"
--%>
<script>
    $(document).ready(function () {
        $("#<%=this.ClientID%> .slick").slick({
            dots: true,
            autoplay: <%=autoPlay%>,
            autoplaySpeed: 4000,
            slidesToScroll: 1,
            slidesToShow: <%=slidesToShow[0]%>,
            responsive: [
                { breakpoint: 1200, settings: { slidesToShow: <%=slidesToShow[1]%>}},
                { breakpoint: 992, settings: { slidesToShow: <%=slidesToShow[2]%>}},
                { breakpoint: 768, settings: { slidesToShow: <%=slidesToShow[3]%>}},
                { breakpoint: 480, settings: { slidesToShow: <%=slidesToShow[4]%>}}
            ]
        });
    });
</script>
<!-- /.wid-page_unit -->

