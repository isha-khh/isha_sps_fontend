<%@ Control Language="C#" AutoEventWireup="true" CodeFile="list_carousel.ascx.cs" Inherits="list_carousel" %>
<!--uc:eZmod_list_carousel-->
<div class="wid wid-list_carousel" id="<%=this.ClientID%>">
    <div class="h2"><%=_t(BlockTitle) %></div>
    <div class="slick list">
    <asp:Repeater ID="ListRepeater" runat="server" OnItemDataBound="ListRepeater_ItemDataBound">
        <ItemTemplate>
        <div class="list_item">
            <%--<a href="<%= ResolveUrl("~/page/" + DataSource + "/show.aspx?num=" + Eval("num")) %>">--%>
            <asp:HyperLink ID="HyperLink1" runat="server">
                <div class="pic"><asp:Image ID="pic" runat="server" CssClass="img-responsive center-block" /></div>
                <div class="info">
                    <p class="title"><asp:Literal ID="subject" runat="server"></asp:Literal></p>
                    <small class="date"><asp:Literal ID="uptime" runat="server"></asp:Literal></small>
                    <p class="desc"><asp:Literal ID="description" runat="server"></asp:Literal></p>
                    <p class="price"><asp:Literal ID="price" runat="server"></asp:Literal></p>
                </div>
                </asp:HyperLink>
            <%--</a>--%>
        </div>
        </ItemTemplate>
    </asp:Repeater>    
    </div><!-- /.slick -->
    <a href="<%=u.WebRoot() %>page/<%=DataSource%>/index.aspx" class="btn-more">more</a>
</div><!-- /.wid-list_carouse -->

<%--
    # DataSource 參數，選擇讀取的資料來源，預設值"news" (可用參數:"news","product","album")
    # slidesCol 參數，各尺寸轉盤個數設定方式說明：
        1. 在頁面上已插入UC的上，加入 slidesCol="A,B,C,D,E" 參數
        2. 按順序分別指定各尺寸欲顯示個數
            A=1200以上 ; B=1200~993 ; C=992~769 ; D=768~480 ; E=480以下
        3. 未指定的尺寸則為預設值 (4,3,2,1,1)
        4. 如所有尺寸均相同，可只設定一組 slidesCol="3" = slidesCol="3,3,3,3,3"
--%>

<script type="text/javascript">
    $(document).ready(function () {
        $("#<%=this.ClientID%> .slick").slick({
            dots: true,
            autoplay: <%=autoPlay%>,
            autoplaySpeed: 4000,
            slidesToScroll: 1,
            slidesToShow: <%=slidesToShow[0]%>,
            responsive: [
              {breakpoint: 1200,settings: {slidesToShow: <%=slidesToShow[1]%>}},
              {breakpoint: 992,settings: {slidesToShow: <%=slidesToShow[2]%>}},
              {breakpoint: 768,settings: {slidesToShow: <%=slidesToShow[3]%>}},
              {breakpoint: 480,settings: {slidesToShow: <%=slidesToShow[4]%>}}
            ]
        });
    });
</script>