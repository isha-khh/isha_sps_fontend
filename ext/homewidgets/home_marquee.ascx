<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_marquee.ascx.cs" Inherits="page__uc_index_marquee" %>
<!--uc:eZmod_home_marquee-->
<div class="marquee" >

    <asp:Repeater ID="NewsRepeater" runat="server" OnItemDataBound="NewsRepeater_ItemDataBound">
        <ItemTemplate>
            <span class="item">
                <asp:HyperLink ID="itemLink" runat="server">
                    <small class="date"><asp:Literal ID="uptime" runat="server"></asp:Literal></small>
                    <asp:Literal ID="subject" runat="server"></asp:Literal>
                </asp:HyperLink>
            </span>
        </ItemTemplate>
    </asp:Repeater>    

</div>

<style>
    .marquee {
        height: 1em;
        overflow: hidden;
    }

    <%if(Direction == "up" ||  Direction == "down") {%>
    .marquee .item{ display:block; }
    <%}%>
</style>

<script src="<%=u.WebRoot()%>js/jQuery.Marquee-master/jquery.marquee.min.js"></script>
<script>
    $(function () {
        $('.marquee').marquee({
            direction: "<%=Direction%>" , // 播放方向 預設值:left,right,up,down
            duration: <%=Speed%> , // 播放速度 預設值:5000
            pauseOnHover: <%=HoverPause%> , //Hover停止 預設值:false
        });
    });
</script>
