<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_qa_list.ascx.cs" Inherits="home_qa" %>
<!--uc:home_qa_list_000-->
<div class="wid wid-home-qa list-box" id="<%=this.ClientID%>">
    <h2><%=_t(BlockTitle) %></h2>
    <div class="slick list">
        <asp:Repeater ID="QARepeater" runat="server" OnItemDataBound="QARepeater_ItemDataBound">
            <ItemTemplate>
                <div class="list_item">
                    <asp:HyperLink ID="picWrap" runat="server" CssClass="pic">
                        <asp:Image ID="pic" runat="server" CssClass="img-responsive center-block" />
                    </asp:HyperLink>
                    <asp:HyperLink ID="knidLink" runat="server" Visible="false" CssClass="kind"></asp:HyperLink>
                    <asp:HyperLink ID="itemLink" runat="server" CssClass="info">
                        <p class="title">
                            <asp:Literal ID="subject" runat="server"></asp:Literal>
                        </p>
                        <p class="desc">
                            <asp:Literal ID="description" runat="server"></asp:Literal>
                        </p>
                    </asp:HyperLink>
                </div>
            </ItemTemplate>
        </asp:Repeater>
    </div>
    <!-- /.slick -->
    <asp:HyperLink ID="btnMore" runat="server" CssClass="btn-more"></asp:HyperLink>
</div>
<!-- /.wid-home-qa -->

<%--
    # slidesCol 參數，各尺寸轉盤個數設定方式說明：
        1. 在頁面上已插入UC的上，加入 slidesCol="A,B,C,D,E" (預設值"4,3,2,1,1") 
        2. A=1200以上 ; B=1200~993 ; C=992~769 ; D=768~480 ; E=480以下
        3. 如所有尺寸均相同，設一組即可 EX: slidesCol="3"
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
                { breakpoint: 1200, settings: { slidesToShow: <%=slidesToShow[1]%>}},
                { breakpoint: 992, settings: { slidesToShow: <%=slidesToShow[2]%>}},
                { breakpoint: 768, settings: { slidesToShow: <%=slidesToShow[3]%>}},
                { breakpoint: 480, settings: { slidesToShow: <%=slidesToShow[4]%>}}
            ]
        });
    });
</script>