<%@ Control Language="C#" AutoEventWireup="true" CodeFile="slideBanner.ascx.cs" Inherits="slideBanner" %>
<!--uc:wid_slideBanner-->
<script src="<%=u.WebRoot() %>js/jcarousel-master/dist/jquery.jcarousel.js"></script>

<div class="wid wid-slideBanner">
    <div class="h3">
        <%=_t("推薦商品") %>
    </div>
    <div class="jcarousel-wrapper">
        <div class="jcarousel">
            <ul>
                <asp:Repeater ID="Repeater1" runat="server" OnItemDataBound="Repeater1_ItemDataBound">
                    <ItemTemplate>
                        <li>
                            <a href="<%# ResolveUrl("~/page/product/show.aspx?num=" + Eval("num")) %>">
                                <asp:Image ID="pic" runat="server" CssClass="img-fluid" />
                            </a>
                        </li>
                    </ItemTemplate>
                </asp:Repeater>
            </ul>
        </div>
        <!-- /.jcarousel -->
        <a href="#" class="jcarousel-control-prev"><span class="d-none">上一個</span></a>
        <a href="#" class="jcarousel-control-next"><span class="d-none">下一個</span></a>
    </div>
    <!-- /.jcarousel-wrapper -->
</div>
<script>
    $(document).ready(function () {
        var jcarousel = $('.wid-slideBanner .jcarousel');

        jcarousel
            .on('jcarousel:reload jcarousel:create', function () {
                var carousel = $(this),
                    width = carousel.innerWidth();
                //width = width / 3;
                if (width >= 600) {
                    width = width / 3;
                } else if (width >= 350) {
                    width = width / 2;
                }

                carousel.jcarousel('items').css('width', Math.ceil(width) + 'px');
            })
            .jcarousel({
                wrap: 'circular'
            });

        jcarousel.siblings('.jcarousel-control-prev')
            .jcarouselControl({
                target: '-=1'
            });

        jcarousel.siblings('.jcarousel-control-next')
            .jcarouselControl({
                target: '+=1'
            });
    });
</script>
