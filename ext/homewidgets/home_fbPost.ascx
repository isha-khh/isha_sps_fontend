<%@ Control Language="C#" AutoEventWireup="true" CodeFile="home_fbPost.ascx.cs" Inherits="ext_homewidgets_home_fbPost" %>

<!-- UC:home_fbPost -->
<div class="wid wid-home-fbPost">
    <div class="h2"><%=_t("首頁FB粉絲團") %></div>

    <script>
        // 2017/12 - JavaScript SDK
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = 'https://connect.facebook.net/zh_TW/sdk.js#xfbml=1&version=v2.11';
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    </script>

    <div class="fb-page"
        data-href="https://zh-tw.facebook.com/eztrust"
        data-width="500" 
        data-height="400"
        data-adapt-container-width="true"
        data-tabs="timeline,messages" 
        data-small-header="true" 
        data-hide-cover="false"
        data-show-facepile="true">
        <blockquote cite="https://zh-tw.facebook.com/eztrust" class="fb-xfbml-parse-ignore"><a href="https://zh-tw.facebook.com/eztrust">eztrust</a></blockquote>
    </div>
</div>

<%-- 
    相關參數設定，請參考Facebook官方文件 https://developers.facebook.com/docs/plugins/page-plugin

        參數 : [預設值] 說明
        data-href : [無] Facebook粉絲專頁的網址
        data-widthf : [340] 外掛程式寬度 180 ~ 500 (px)
        data-height : [500] 外掛程式高度 下限 70
        data-adapt-container-width : [true] 配合容器寬度
        data-tabs : [timeline] 要顯示的頁籤 請使用逗號分隔  timeline（動態時報）、events（活動）、messages（訊息）
        data-small-header : [false] 使用小標頭
        data-hide-coverf : [false] 隱藏封面相片
        data-show-facepilef : [true] 顯示按讚朋友
 --%>