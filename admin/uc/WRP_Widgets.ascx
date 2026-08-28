<%@ Control Language="C#" AutoEventWireup="true" CodeFile="WRP_Widgets.ascx.cs" Inherits="admin_uc_WRP_Widgets" %>

<!--UC:WRP_Widgets-->
<div class="col-md-12" id="wrpDiv">
    <div id="wrpPanel" class="panel panel-default form-horizontal information">
        <div class="panel-heading"><strong>WRP公告</strong></div>
        <div class="panel-body">
            <div class="wrpNews_lsit">
                <ul id="wrpUl" class="list-unstyled news_list">
                    <%--<li><a href="#" target="_blank">subject</a><span>uptime</span></li>--%>
                </ul>
            </div>
            <div>
                <a class="more_btn btn btn-normal pull-right" href="https://www.wrp.com.tw" target="_blank">觀看更多</a>
            </div>
        </div>
    </div>
</div>

<script>
    $.ajax({
        url: 'https://www.wrp.com.tw/api/newsezclient.ashx',
        type: 'GET',
        dataType: 'xml',
        timeout: 2000,
        error: function (data) { //讀取失敗
            closeDiv($("#wrpDiv"));
        },
        success: function (data) { //讀取成功
            var dataRow = $(data).find("row"),
                dataMore = $(data).find("more"),
                list = $(".wrpNews_lsit ul.news_list");
            $("#wrpDiv .more_btn").attr("href", dataMore.find("link").text());
            if (dataRow.length > 0) {
                dataRow.each(function (i) {
                    var url = $(this).find("url").text(),
                        uptime = $(this).find("uptime").text(),
                        subject = $(this).find("subject").text(),
                        kind = $(this).find("kind").text();
                    list.append(newLi(url, uptime, subject));
                });
                setTimeout(function () { $(".wrpNews_lsit").mCustomScrollbar("update"); }, 200);
            } else {
                CloseDiv($("#wrpDiv"));
            }
        }
    });
    function closeDiv(DOM) { DOM.remove(); }
    function newLi(url, uptime, subject) {
        var aTag = $("<a>").attr({ "href": url, "target": "_blank" }).text(subject),
            spanTag = $("<span>").text(uptime),
            liTag = $("<li>").append(aTag, spanTag);
        return liTag;
    }
</script>
<!--END UC:WRP_Widgets-->
