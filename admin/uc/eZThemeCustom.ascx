<%@ Control Language="C#" AutoEventWireup="true" CodeFile="eZThemeCustom.ascx.cs" Inherits="eZThemeCustom" %>
<style>

       /*首頁背景*/
    body.home {
        <%=template_bg[0]%>
        <%=template_repeat[0]%>
    }

    /*內頁背景*/
    body {
        <%=template_bg[1]%>
        <%=template_repeat[1]%>
    }

     /*首頁標題區塊背景*/
    body.home .header{
        <%=template_bg[2]%>
        <%=template_repeat[2]%>
    }
  
     /*標題區塊背景*/
    .header {
       <%=template_bg[3]%>
       <%=template_repeat[3]%>
    }
    
     /*LOGO*/
    .header .navbar .navbar-header .navbar-brand {
         <%=GET_LOGO()%>
    }
    .header .wrp-deco.avatar {
        <%=frame_top%> 
        <%=frame_left%>
        <%=frame_display%> 
    }
</style>
<script>
    $(document).ready(function () {
        //以class設定.wrp-deco.avatar的z-index   
        //選項為:不指定, 在前面, 在後面
        var avatar_class = "<%=frame_zindex%>"; /**程式要帶入節慶主題是預設、前或後**/
        $(".header .wrp-deco.avatar").addClass(avatar_class);
    });
</script>
