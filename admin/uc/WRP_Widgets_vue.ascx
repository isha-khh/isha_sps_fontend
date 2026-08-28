<%@ Control Language="C#" AutoEventWireup="true" CodeFile="WRP_Widgets_vue.ascx.cs" Inherits="admin_uc_WRP_Widgets" %>

<!--UC:WRP_Widgets-->
<div class="col-md-12" id="wrpDiv">
    <div id="wrpPanel" class="panel panel-default form-horizontal information" v-if="view">
        <div class="panel-heading"><strong>WRP公告</strong></div>
        <div class="panel-body">
            <div class="wrpNews_lsit">
                <ul id="wrpUl" class="list-unstyled news_list">
                    <li v-for="item in items">
                        <a href="{{ item.url }}">{{ item.subject }}</a><span>{{ item.uptime }}</span>
                    </li>
                </ul>
            </div>
            <div>
                <a class="more_btn btn btn-normal pull-right" href="{{ moreLlik }}" target="_blank">觀看更多</a>
            </div>
        </div>
    </div>
</div>

<script src="//cdnjs.cloudflare.com/ajax/libs/vue/1.0.8/vue.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/x2js/1.2.0/xml2json.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/vue-resource/0.1.16/vue-resource.min.js"></script>
<script>
    var x2js = new X2JS();
    new Vue({
        el: "#wrpDiv",
        data: {
            view: true,
            moreLlik: 'https://www.wrp.com.tw',
            items: []
        },
        ready: function () {
            this.$http.get('https://www.wrp.com.tw/api/newsezclient.ashx')
                .then((r) => {
                    let wrpData = x2js.xml_str2json(r.data);
                    this.items = wrpData.news.row;
                    this.moreLlik = wrpData.news.more.link;
                    view: true,
                    setTimeout(function () { $(".wrpNews_lsit").mCustomScrollbar("update"); }, 200);
                }, (r) => {
                    this.view = false;
                })
        }
    });
</script>
<!--END UC:WRP_Widgets-->
