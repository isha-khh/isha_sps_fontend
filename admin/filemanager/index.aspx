<%@ Page Language="C#" AutoEventWireup="true" CodeFile="index.aspx.cs" Inherits="admin_filemanager_index" %>

<%@ Register Src="~/admin/uc/header.ascx" TagPrefix="uc1" TagName="header" %>

<html xmlns="http://www.w3.org/1999/xhtml" >
<head id="Head1" runat="server">
<title>已上傳檔案夾</title>

<link href="admin.css" rel="stylesheet" type="text/css">

     <style type="text/css">
	 html, body {     
            width:100%;
            height:100%;    
             background-color: #ffffff;
			 overflow:auto;
        }
     
   
	
    .picdiv
                    {
                        
                        width:140px;
                        text-align:center;
                        padding:5px;
                        float:left;
                        
                        }
    .picdivtd
                     {
                         width:132px;
                         height:132px;
                         border-style:solid;
                         border-color:Silver;
                         border-width:1px;                         
                         empty-cells:show;
                         background-color:White;
                         padding:0px;
                         }
 </style>

<script type="text/javascript">
 
    function OpenFile(fileUrl) {
        window.opener.CKEDITOR.tools.callFunction(<%= ValString(Request["CKEditorFuncNum"]) %>, fileUrl);
      //window.opener.SetUrl(fileUrl);
      window.close();
      window.opener.focus();
  }    

</script>
    
    <asp:PlaceHolder ID="iePlaceHolder" runat="server" Visible ="false">
        
	<script type="text/javascript" src="../../App_Script/swfupload/swfupload.js"></script>
	<script type="text/javascript" src="../../App_Script/swfupload/handlers2.js"></script>
    </asp:PlaceHolder>
    <asp:PlaceHolder ID="otherPlaceHolder" runat="server" Visible="false">
                <link href="../../App_Script/jquery-upload-file-master/css/uploadfile.css" rel="stylesheet" />
<script src="../../App_Script/jquery-1.12.4.min.js"></script>
<script src="../../App_Script/jquery-upload-file-master/js/jquery.uploadfile.js"></script>
    </asp:PlaceHolder>


<script type="text/javascript">
    //---------------------------------checkbox全選用---------------------------------------------------
    function Check(parentChk, ChildId) {
        var oElements = document.getElementsByTagName("INPUT");
        var bIsChecked = parentChk.checked;

        for (i = 0; i < oElements.length; i++) {
            if (IsCheckBox(oElements[i]) &&
            IsMatch(oElements[i].id, ChildId)) {
                oElements[i].checked = bIsChecked;
            }

        }
    }

    function IsMatch(id, ChildId) {
        var sPattern = '^ctl00_ContentPlaceHolder1_GridView1.*' + ChildId + '$';
        var sPattern = '^Repeater1_.*' + ChildId + '$';
        var oRegExp = new RegExp(sPattern);
        if (oRegExp.exec(id))
            return true;
        else
            return false;
    }

    function IsCheckBox(chk) {
        if (chk.type == 'checkbox') return true;
        else return false;
    }
                     </script>


</head>
<body>
    <form id="form1" runat="server">
    <div style="text-align: center">
        <asp:Label ID="L_login_msg" runat="server" ForeColor="Red"></asp:Label><br />
        <asp:Panel ID="Panel1" runat="server">
        <table width="600" align="center">
            <tr>
                <td align="center"><font class="title1">檔案(圖片)管理系統
                    
                    <asp:Label ID="L_total" runat="server"></asp:Label></font></td>
            </tr>
            <tr>
                <td align="center"><asp:Label ID="L_errmsg" runat="server" /></td>
            </tr>
            <tr><td class="td_bg_line"></td></tr>
<%  if (ValString(Request["mode"]) !="upload"){%>
            <tr>
                <td align="center">
                    <div align="center" class="word5">注意：若為「系統資料夾」或資料夾中尚有資料，則該資料夾無法刪除！</div>
                </td>
            </tr>
<% }%>

             <tr><td class="td_word150" align="left">
                <asp:Image ID="Image2" runat="server" ImageUrl="skin/icon09.gif" />
                <asp:Label ID="L_path" runat="server"></asp:Label> 
                </td></tr>
            <tr><td class="td_word150" align="center">
                <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label></td></tr>
            <tr runat ="server" id="tr1"><td class="td_bg_line"></td></tr>
        </table>
         
            <asp:MultiView ID="MultiView1" runat="server" ActiveViewIndex="0">
                <asp:View ID="View1" runat="server">
                  
     <table width="600" cellpadding="0" cellspacing="0" align="center">
    <tr><td align="left">

    <div style="width:600px">
        <div style="float:left">
               <input type="checkbox" id="chkAll" name="chkAll" onClick="Check(this,'CheckBox1')" /><label for="chkAll">全選</label>

         <span style="margin-left:20px">排序方式：</span>
                   <asp:DropDownList ID="sortWay" runat="server" AutoPostBack="true" OnSelectedIndexChanged="sortWay_SelectedIndexChanged">
                        <asp:ListItem Value="c_date$desc" Text="依日期"></asp:ListItem>
                        <asp:ListItem Value="filename$asc" Text="依檔名"></asp:ListItem>
                   </asp:DropDownList>
            </div>
        <asp:Panel ID="searchPanel" style="float:right" runat="server" DefaultButton="searchBt">
                <table border="0">
                    <tr>                        
                        <td>搜尋此目錄的檔案：</td>
                        <td><asp:TextBox ID="search" runat="server"></asp:TextBox></td>
                        <td><asp:LinkButton ID="searchBt" runat="server" CausesValidation="false" OnClick="searchBt_Click"><img src="skin/04.gif" border="0" /></asp:LinkButton></td>
                    </tr>
                </table>                
        </asp:Panel>
    </div>
      
        <div style="clear:both">
       <asp:Repeater id=Repeater1 runat="server" OnItemDataBound="Repeater1_ItemDataBound">   
          <ItemTemplate>

       <div class="picdiv">                 
                <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr><td align="center" valign="middle" class="picdivtd"><%#Eval("review") %></td></tr></table>
                <div style="width:120px; height:20px; overflow:hidden; text-align:left">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr><td width="10" valign="top">
                    <asp:CheckBox ID="CheckBox1" Visible="false" runat="server" />
                    </td><td align="left" style="color:blue">
                    <%#Eval("filename")%>
                    <asp:ImageButton ID="ImageButton1"  runat="server" Visible="false" OnClientClick="return confirm('是否確定刪除此資料夾？注意，若此資料夾中尚有資料時，將無法刪除！');" CommandArgument='<%#Eval("filename2") + "|" + Eval("filekind")%>' OnClick="ImageButton1_Click" ImageUrl="skin/del.gif" />
                    </td></tr>
                </table>                
                </div>           
           <div style="float :right ; text-align:right; color:green">
               <%#Eval("filesize") %>
           </div>
           <asp:HiddenField ID="filekind" runat="server" />                       
        </div>  
              
              <asp:Panel ID="splitDiv" style="clear:both" Visible="false" runat="server"></asp:Panel> 
                 
          </ItemTemplate> 
       </asp:Repeater>

            </div>
       </td>
       </tr>
       </table>

<table width="600" align="center">
            <tr><td align="center">
                <asp:LinkButton ID="LinkButton1" Font-Underline="false" OnClick="LinkButton1_Click" runat="server">上一頁</asp:LinkButton>
            &nbsp;|&nbsp;
                <asp:LinkButton ID="LinkButton2" Font-Underline="false" OnClick="LinkButton2_Click" runat="server">下一頁</asp:LinkButton>
            &nbsp;|&nbsp;
            第
                <asp:DropDownList ID="nowpage" AutoPostBack="true" runat="server" OnSelectedIndexChanged="nowpage_SelectedIndexChanged">
                </asp:DropDownList>
            頁，共
                <asp:Label ID="maxpage" runat="server"></asp:Label>
            頁，總計
                <asp:Label ID="dirTotal" runat="server"></asp:Label>
                個資料夾
                <asp:Label ID="total" runat="server"></asp:Label>
            個檔案
            </td></tr>       
         <tr><td align="center">
        <table border="0">
                    <tr>
                         <td valgin="top">
                              <asp:ImageButton ID="ImageButton2" runat="server" ImageUrl="skin/upload.gif" OnClick="ImageButton2_Click" />
                             </td>                       
                        <td valgin="top">
                            <asp:ImageButton ID="dell_all" runat="server" ImageUrl="skin/del_all.gif" OnClientClick="return confirm('是否確定刪除勾選的檔案？');" OnClick="dell_all_Click" />
                        </td>
                    </tr>
                </table>
             </td></tr>
        </table>
<asp:Panel ID="Panel2" runat="server">
    <asp:Panel ID="Panel3" runat="server" Visible="false">
    <table align="center" bgcolor="#ffffff" border="1" cellpadding="2" cellspacing="0" width="600">
            <tr>
                <td class="td4a" colspan="2">
                    <div align="center">檔案上傳系統</div>
                </td>
            </tr>
            <tr>
                <td class="td1a" width="100">
                    <div align="right">上傳1：</div>
                </td>
                <td class="td2a">
                    <input id="file1" runat="server" name="file" type="file" size="50" /></td>
            </tr>
            <tr>
                <td class="td1a">
                    <div align="right">上傳2：</div>
                </td>
                <td class="td2a">
                    <input id="file2" runat="server" name="file" type="file" size="50" /></td>
            </tr>
            <tr>
                <td class="td1a">
                    <div align="right">上傳3：</div>
                </td>
                <td class="td2a"><input id="file3" runat="server" name="file" type="file" size="50" /></td>
            </tr>
            <tr>
                <td align="center" class="td4a" colspan="2" height="30"><asp:ImageButton ID="Button1" runat="server" ImageUrl="skin/upload.gif" OnClick="Button1_Click" /></td>
            </tr>
        </table>
         <table width="600" align="center">
            <tr><td class="td_bg_line"></td></tr>
        </table>
    </asp:Panel>
       

       
        <table align="center" bgcolor="#ffffff" border="1" cellpadding="2" cellspacing="0" width="600">
            <tr>
                <td class="td4a" colspan="2">
                    <div align="center">
                        新增資料夾</div>
                </td>
            </tr>
            <tr>
                <td class="td1a" width="100">
                    <div align="right">
                        資料夾名稱：</div>
                </td>
                <td class="td2a">
                    <asp:TextBox ID="folder_name" runat="server" Width="400px"></asp:TextBox>
                     <asp:RegularExpressionValidator ValidationGroup="folder_va" ControlToValidate="folder_name" Display="Dynamic" ErrorMessage="<div>只能輸入英文或數字！</div>" ID="RegularExpressionValidator11" runat="server" ValidationExpression="^[A-Za-z0-9]+$" /> 
                    </td>
            </tr>
            <tr>
                <td align="center" class="td4a" colspan="2" height="30"><asp:ImageButton ID="creat_folder" ValidationGroup="folder_va" OnClick="creat_folder_Click" runat="server" ImageUrl="skin/newfolder.gif" /></td>
            </tr>
        </table>
        <table width="600" align="center">
            <tr><td class="td_bg_line"></td></tr>
        </table>
</asp:Panel>   
                </asp:View>
                <asp:View ID="View2" runat="server">
        <center>
          <div id="swfu_container" style="margin: 0px 10px;">
		  
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <asp:Panel ID="ieUploadDiv" runat="server" Visible="false">
                            <span id="spanButtonPlaceholder"></span>
                            <script type="text/javascript">
                                var swfu;
                                window.onload = function() {
                                    swfu = new SWFUpload({
                                        // Backend Settings
                                        upload_url: "upload.aspx?dirname=<%=ValString(Request["dirname"])%>",
	            post_params: {
	                "ASPSESSID": "1"
	            },

	            // File Upload Settings
	            file_size_limit: "4 MB",
	            file_types: "*.*",
	            file_types_description: "Files",
	            file_upload_limit: "0",    // Zero means unlimited

	            // Event Handler Settings - these functions as defined in Handlers.js
	            //  The handlers are not part of SWFUpload but are part of my website and control how
	            //  my website reacts to the SWFUpload events.
	            file_queue_error_handler: fileQueueError,
	            file_dialog_complete_handler: fileDialogComplete,
	            upload_progress_handler: uploadProgress,
	            upload_error_handler: uploadError,
	            upload_success_handler: uploadSuccess,
	            upload_complete_handler: uploadComplete,

	            // Button settings
	            button_image_url: "../../App_Script/swfupload/images/XPButtonNoText_160x22.png",
	            button_placeholder_id: "spanButtonPlaceholder",
	            button_width: 160,
	            button_height: 22,
	            button_text: '<span class="buttonSmall">請選擇要上傳的檔案</span>',
	            button_text_style: '.button { font-family: Helvetica, Arial, sans-serif; font-size: 14pt;} .buttonSmall { font-size: 12pt; }',
	            button_text_top_padding: 1,
	            button_text_left_padding: 5,

	            // Flash Settings
	            flash_url: "../../App_Script/swfupload/swfupload.swf", // Relative to this file

	            custom_settings: {
	                upload_target: "divFileProgressContainer"
	            },

	            // Debug Settings
	            debug: false
	        });
	    }
	</script>
                        </asp:Panel>
                    <asp:Panel ID="otherUploadDiv" runat="server" Visible="false">
                            <div id="fileuploader">請選擇要上傳的檔案</div>
                <script>
                            $(document).ready(function()
                            {
                                //參考http://hayageek.com/docs/jquery-upload-file.php
                                $("#fileuploader").uploadFile({
                                    url:"upload.aspx?dirname=<%=ValString(Request["dirname"])%>",
                                    fileName:"Filedata",
                                    uploadFolder:"<%= ViewState["root_path"] + ValString(Request["dirname"]) %>",
                                    afterUploadAll:function()
                                    {
                                        $("#divFileProgressContainer").html("<div style='padding-top:10px'>您所選擇的檔案皆已上傳</div>");	
                                    }
                                });
                     
                            });
            </script>
                    </asp:Panel>                       
                     

</td>
               </tr>
              </table>
		
		    <div id="divFileProgressContainer" style="height: 75px;"></div>
		    <div id="thumbnails"></div>
	    </div>
         <table width="600" align="center">
            <tr><td class="td_bg_line"></td></tr>
        </table>
        </center>
                </asp:View>
            </asp:MultiView>

        
        <table width="600" align="center">
            <tr>
                <td height="30" valign="bottom" align="center">
                    <asp:LinkButton ID="Button2" runat="server"  OnClick="Button2_Click"><img src="skin/back.gif" /></asp:LinkButton>
                    <a href="javascript:window.close()"><asp:Image ID="Image1" runat="server" ImageUrl="skin/close.gif" /></a></td>
            </tr>
        </table>
        </asp:Panel>
        </div>
    </form>
</body>
</html>

