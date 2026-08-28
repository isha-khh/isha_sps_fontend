<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="setting.aspx.cs" Inherits="admin_item_setting" ValidateRequest="false" %>


<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">

    <style type="text/css">
        .tab-pane {
            padding-top: 20px;
            /*min-height:380px;  */
        }  
    </style>
        <link href="../../App_Script/lightbox/css/lightbox.css" rel="stylesheet" />
    <script src="../../App_Script/lightbox/js/lightbox.min.js"></script>

        <link href="../../App_Script/bootstrap_toggle/css/bootstrap-toggle.min.css" rel="stylesheet" />
    <script src="../../App_Script/bootstrap_toggle/js/bootstrap-toggle.min.js"></script>
    <script type="text/javascript">
        function checkZip(sender, args) {
            var isValid = false;
            $("#<%= CustomValidator1.ClientID %>").css("display", "inline-block");   
            if (args.Value >= 0 && args.Value <= 1200)
            {
                $("#<%= CustomValidator1.ClientID %>").css("display", "none");  
                isValid = true;
            }
                
            args.IsValid = isValid;
        } 
    </script>
</asp:Content>

<asp:Content ID="Content3" ContentPlaceHolderID="breadcrumb_holder" runat="Server">
    <ol class="breadcrumb">
        <li><a href="../index2.aspx"><span class="ezicon ezicon-home"></span></a></li>
        <li><%=loginInfo.menuRootName %></li>
        <li class="active"><%=loginInfo.menuSubName %></li>
    </ol>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder" runat="Server">


    <asp:Panel ID="Panel1" runat="server" DefaultButton="editButton">

        <div class="content_box">

            <asp:Panel ID="Panel2" runat="server" CssClass="panel panel-default">

                <div class="panel-heading">網站參數設定</div>


                <div class="panel-body form-horizontal" role="form">

                    <div class="form-group">
                        <label for="user_id" class="col-sm-2 control-label">* 公司名稱</label>
                        <div class="col-sm-10">
                            <p class="form-control-static">

                                <input type="text" class="form-control" id="com_name" runat="server" placeholder="公司名稱" maxlength="25" />
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="com_name" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>

                            </p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="user_id" class="col-sm-2 control-label">* 公司信箱</label>
                        <div class="col-sm-10">
                            <p class="form-control-static">
                                <asp:UpdatePanel ID="UpdatePanel3" runat="server">
                                    <ContentTemplate>
                                        <input type="text" class="form-control" id="com_mail" runat="server" placeholder="公司信箱" maxlength="100" />
                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="com_mail" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                        <asp:RegularExpressionValidator ControlToValidate="com_mail" Display="Dynamic" SetFocusOnError="true" ErrorMessage="格式有誤" ID="RegularExpressionValidator1" runat="server" ValidationExpression="\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*" />
                                    </ContentTemplate>
                                </asp:UpdatePanel>
                            </p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="user_id" class="col-sm-2 control-label">BCC</label>
                        <div class="col-sm-10">
                            <p class="form-control-static">
                                (說明：設定密件請一行輸入一個E-mail。)<br />
                                <asp:TextBox ID="bcc_mail" TextMode="MultiLine" Height="100" runat="server" CssClass="form-control"></asp:TextBox>

                            </p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="user_id" class="col-sm-2 control-label">* 網址</label>
                        <div class="col-sm-10">
                            <p class="form-control-static">

                                <input type="text" class="form-control" id="pic_url" runat="server" placeholder="網址" maxlength="50" />
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="pic_url" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                            </p>
                           <p class="form-control-static">
                                  <asp:HyperLink ID="qrcodeBtn" runat="server" data-lightbox="roadtrip" CssClass="btn btn-default" >  
                                        <span class="glyphicon glyphicon-qrcode"></span> QR Code
                                 </asp:HyperLink>
                             ( 網址若有變更請先儲存，QR Code才會生效。)
                            </p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-sm-3 col-md-2 control-label">LOGO</label>
                        <div class="col-sm-9  col-md-10">
                            <p class="form-control-static">
                                <asp:FileUpload ID="FileUpload1" runat="server" />

                                <asp:CheckBox ID="dellogo" runat="server" Visible="false" Text="刪除LOGO" />
                                <asp:HiddenField ID="logo" runat="server" />
                            </p>
                            <div>
                                <asp:Image ID="logoImg" runat="server" Style="margin: 5px; width: 178px;" />
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-sm-3 col-md-2 control-label">Favicon</label>
                        <div class="col-sm-9  col-md-10">
                            <p class="form-control-static">
                                (建議尺寸: 310*310px)<br />
                                <asp:FileUpload ID="FileUpload2" runat="server" />

                                <asp:CheckBox ID="delfavicon" runat="server" Visible="false" Text="刪除favicon" />
                                <asp:HiddenField ID="favicon" runat="server" />
                            </p>
                            <div>
                                <asp:Image ID="faviconImg" runat="server" Style="margin: 5px; width: 178px;" />
                            </div>
                            <p class="form-control-static">
                                背景色：
                                 <asp:DropDownList ID="faviconBgColor" runat="server" CssClass="form-control" Style="width: auto; display: inline">
                                     <asp:ListItem Value="White" Text="淺色-白"></asp:ListItem>
                                     <asp:ListItem Value="Black" Text="深色-黑"></asp:ListItem>
                                 </asp:DropDownList>
                            </p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="user_id" class="col-sm-2 control-label">登入設定</label>
                        <div class="col-sm-10">
                              <label class="checkbox-inline">
                                     <input type="checkbox" id="log_class" runat="server" data-toggle="toggle" data-on="使用Cookie" data-off="使用Session" data-onstyle="success" data-offstyle="info"   />                          
                       (使用Cookie可使登入時間較長)</label>

                         <label class="checkbox-inline hide">                            
                                <asp:CheckBox ID="wrp_news" runat="server" Text="登入後顯示WRP訊息 (每個帳號可自行定義，未定義時則以此為預設)" Visible="false" />
                          </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-sm-2 control-label">隱私權政策</label>
                        <div class="col-sm-10">
                              <label class="checkbox-inline">
                                     <input type="checkbox" id="log_private" runat="server" data-toggle="toggle" data-on="開啟隱私權政策" data-off="關閉隱私權政策" data-onstyle="success" data-offstyle="info"   />                          
                       (開啟後可至頁面資料設定設定文字)</label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="user_id" class="col-sm-2 control-label">通用設定</label>
                        <div class="col-sm-10">
                            <label class="checkbox-inline">
                                     <input type="checkbox" id="kind_expand" runat="server" data-toggle="toggle" data-on="前台分類全部展開" data-off="前台分類點擊展開" data-onstyle="success" data-offstyle="info"   />                          
                     </label>
                         
                            <p class="form-control-static">
                                Head嵌入碼： 
                              <asp:TextBox ID="head_code" runat="server" CssClass="form-control" TextMode="MultiLine" Rows="3" placeholder="要嵌入在Head標籤的碼，例如Google追蹤碼"></asp:TextBox>
                            </p>
                            <p class="form-control-static">
                                Body嵌入碼： 
                              <asp:TextBox ID="body_code" runat="server" CssClass="form-control" TextMode="MultiLine" Rows="3" placeholder="要嵌入在Body標籤的碼"></asp:TextBox>
                            </p>

                            <p id="diskP" runat="server" visible="false" class="form-control-static">
                                上傳使用統計：<asp:Label ID="diskInfo" runat="server"></asp:Label>
                                (僅統計upload資料夾)
                            </p>

                            <asp:PlaceHolder ID="GlobalPlaceHolder" runat="server" Visible="false">

                                <p class="form-control-static">
                                    上傳容量限制：
                    <input type="text" class="form-control" id="file_size_limit" runat="server" placeholder="空間容量" style="width: 80px; display: inline" />
                                    MB
                     <asp:RegularExpressionValidator ControlToValidate="file_size_limit" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required" ID="RegularExpressionValidator2" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" />
                                    (僅設計師模式設定，不限制則不輸入，有輸入才會出現upload資料夾使用量統計)
                                </p>

                                <p class="form-control-static">
                                    圖片壓縮品質(僅設計師模式才能設定)：<br />
                                    <asp:TextBox ID="jpg_quality" runat="server" CssClass="form-control" MaxLength="3" Width="50" Style="display: inline" Text="80"></asp:TextBox>
                                    <asp:RegularExpressionValidator ControlToValidate="jpg_quality" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required" ID="RegularExpressionValidator6" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" />
                                    <asp:RequiredFieldValidator ID="RequiredFieldValidator12" runat="server" ControlToValidate="jpg_quality" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                    (請輸入1~100，數字越高品質越高，圖片檔案越大。)
                                &nbsp; &nbsp;                           
                                </p>
                                  <label class="checkbox-inline">
                                     <input type="checkbox" id="jpg_convert" runat="server" data-toggle="toggle" data-on="啟用" data-off="停用" data-onstyle="success" data-offstyle="danger"   />                          
                       圖片強制轉換成JPG</label>
                                <p class="form-control-static">
                                    圖片最大尺寸(僅設計師模式才能設定)：<br />
                                    <asp:TextBox ID="jpg_maxSize" runat="server" CssClass="form-control" MaxLength="4" Width="65" Style="display: inline" Text="1200"></asp:TextBox>
                                    <asp:CustomValidator ID="CustomValidator1" style="display:none" runat="server" ControlToValidate="jpg_maxSize" ErrorMessage="只能輸入數字0~1200" ClientValidationFunction="checkZip" ValidateEmptyText="True" ForeColor="Red" ValidationGroup="Required"/>
                                    <asp:RequiredFieldValidator ID="RequiredFieldValidator6" runat="server" ControlToValidate="jpg_maxSize" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                    (請輸入0~1200，數字為0表示不縮圖片尺寸。)
                                </p>
                            </asp:PlaceHolder>
                        </div>
                    </div>

                    <asp:Panel ID="SystemSetPanel" runat="server" CssClass="form-group">

                        <label class="col-sm-2 control-label">系統設定</label>
                        <div class="col-sm-10">

                            <div class="tabbable">

                                <ul class="nav nav-tabs" id="SystemUL" runat="server">
                                    <asp:PlaceHolder ID="PlaceHolder1" runat="server"></asp:PlaceHolder>
                                    <li><a runat="server" data-toggle="tab" href="#tab997">SMTP</a></li>
                                    <li><a runat="server" data-toggle="tab" href="#tab998">FTP</a></li>
                                    <li><a runat="server" data-toggle="tab" href="#tab999">WRP</a></li>

                                </ul>

                                <div class="tab-content" id="SystemTab" runat="server">

                                    <asp:PlaceHolder ID="PlaceHolder2" runat="server"></asp:PlaceHolder>


                                    <div class="tab-pane form-group" id="tab997">

                                        <div class="col-sm-10">
                                            <asp:UpdatePanel ID="UpdatePanel2" runat="server">
                                                <ContentTemplate>

                                                    <p class="form-control-static">
                                                        * SMTP
                                <input type="text" class="form-control" id="smtp_url" runat="server" placeholder="SMTP" maxlength="50" />
                                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="smtp_url" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                                    </p>
                                                    <p class="form-control-static">
                                                        * PORT
                                <input type="text" class="form-control" id="smtp_port" runat="server" placeholder="SMTP PORT" maxlength="10" />
                                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator5" runat="server" ControlToValidate="smtp_port" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                                        <asp:CheckBox ID="smtp_ssl" runat="server" Text="&nbsp;SSL" />

                                                    </p>
                                                    <p class="form-control-static">
                                                        帳號
                                <input type="text" class="form-control" id="smtp_user" runat="server" placeholder="SMTP 帳號" />
                                                    </p>
                                                    <p class="form-control-static">
                                                        密碼
                              <asp:TextBox ID="smtp_password" TextMode="Password" runat="server" CssClass="form-control" placeholder="SMTP 密碼"></asp:TextBox>
                                                    </p>
                                                    <p class="form-control-static">
                                                        使用預設驗證：
                     <asp:DropDownList ID="UseDefaultCredentials" runat="server" CssClass="form-control" Style="width: auto; display: inline">
                         <asp:ListItem Value="" Text="不設定(視您的SMTP主機設定來調整)"></asp:ListItem>
                         <asp:ListItem Value="Y" Text="是"></asp:ListItem>
                         <asp:ListItem Value="N" Text="否"></asp:ListItem>
                     </asp:DropDownList>
                                                    </p>
                                                    <p class="form-control-static">
                                                        <asp:LinkButton ID="mailsend" runat="server" CssClass="btn btn-default" OnClick="mailsend_Click">
                            <span class="glyphicon glyphicon-envelope"></span>
                            儲存SMTP設定並測試發送信件</asp:LinkButton>

                                                        <asp:Label ID="mailtest" runat="server" ForeColor="Red"></asp:Label>
                                                    </p>


                                                </ContentTemplate>
                                            </asp:UpdatePanel>
                                        </div>


                                    </div>


                                    <div class="tab-pane form-group" id="tab998">

                                        <div class="col-sm-10">

                                            <p class="form-control-static">
                                                FTP
                                <input type="text" class="form-control" id="ftp_url" runat="server" placeholder="FTP" maxlength="50" />
                                            </p>
                                            <p class="form-control-static">
                                                PORT
                                <input type="text" class="form-control" id="ftp_port" runat="server" placeholder="FTP PORT" maxlength="10" />
                                            </p>
                                            <p class="form-control-static">
                                                帳號
                                <input type="text" class="form-control" id="ftp_user" runat="server" placeholder="FTP 帳號" maxlength="25" />
                                            </p>
                                            <p class="form-control-static">
                                                密碼
                       <asp:TextBox ID="ftp_password" TextMode="Password" runat="server" CssClass="form-control" placeholder="FTP 密碼" MaxLength="25"></asp:TextBox>
                                            </p>
                                            <p class="form-control-static">
                                                資料夾
                                <input type="text" class="form-control" id="ftp_dir" runat="server" placeholder="FTP資料夾" maxlength="50" />
                                            </p>
                                            <p class="form-control-static">
                                                * 此區必需設定才支援線上更新功能
                                            </p>
                                        </div>


                                    </div>

                                    <div class="tab-pane form-group" id="tab999">

                                        <div class="col-sm-10">

                                            <p class="form-control-static">
                                                帳號
                                <input type="text" class="form-control" id="wrp_user" runat="server" placeholder="WRP 帳號" maxlength="25" />
                                            </p>
                                            <p class="form-control-static">
                                                密碼
                       <asp:TextBox ID="wrp_password" TextMode="Password" runat="server" CssClass="form-control" placeholder="WRP 密碼" MaxLength="25"></asp:TextBox>
                                            </p>

                                        </div>


                                    </div>



                                </div>

                            </div>

                        </div>

                    </asp:Panel>




                    <div class="form-group">
                        <div class="col-sm-offset-2 col-sm-10">
                            <asp:LinkButton ID="editButton" runat="server" CssClass="btn btn-default" ValidationGroup="Required" OnClick="editButton_Click">
                            <span class="glyphicon glyphicon-floppy-disk"></span>
                            儲存變更</asp:LinkButton>

                            <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                        </div>
                    </div>


                </div>






            </asp:Panel>

            <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <asp:Panel ID="BackupPanel" runat="server" CssClass="panel panel-default" Visible="false">

                        <div class="panel-heading">資料庫備份與還原</div>


                        <div class="panel-body form-horizontal" role="form">


                            <div class="form-group">
                                <label class="col-sm-2 control-label">功能</label>
                                <div class="col-sm-10">
                                    <p class="form-control-static">
                                        <asp:LinkButton ID="RunBackup" runat="server" CssClass="btn btn-default" OnClick="RunBackup_Click">
                            <span class="glyphicon glyphicon-hdd"></span>
                            備份</asp:LinkButton>

                                        <asp:LinkButton ID="RestoreBackup" runat="server" CssClass="btn btn-default" OnClick="RestoreBackup_Click" OnClientClick="return msgconfirm('您確定要還原？<br>建議您還原之前先備份，還原點之後新增的資料將會不存在！',this)">
                            <span class="glyphicon glyphicon-repeat"></span>
                            還原</asp:LinkButton>

                                        <asp:LinkButton ID="DelBackup" runat="server" CssClass="btn btn-default" OnClick="DelBackup_Click">
                            <span class="glyphicon glyphicon-trash"></span>
                            刪除</asp:LinkButton>

                                        <asp:Label ID="BackupMsg" runat="server" ForeColor="Red"></asp:Label>
                                    </p>

                                </div>
                            </div>

                            <div class="form-group">
                                <label class="col-sm-2 control-label">清單</label>
                                <div class="col-sm-10">

                                    <div class="form-control" style="min-height: 50px; min-height: 150px;">
                                        <asp:CheckBoxList ID="BackupHistory" runat="server" RepeatDirection="Vertical" RepeatLayout="Flow"></asp:CheckBoxList>
                                    </div>

                                </div>
                            </div>

                        </div>

                    </asp:Panel>

                    <asp:Panel ID="recoveryPanel" runat="server" CssClass="panel panel-default" Visible="false">

                        <div class="panel-heading">網站還原成初始設定</div>


                        <div class="panel-body form-horizontal" role="form">


                            <div class="form-group">
                                <label class="col-sm-2 control-label">功能</label>
                                <div class="col-sm-10">
                                    <p class="form-control-static">

                                        <asp:LinkButton ID="recoveryBtn" runat="server" CssClass="btn btn-default" OnClick="recoveryBtn_Click" OnClientClick="return msgconfirm('您確定要執行？',this)">
                            <span class="glyphicon glyphicon-hdd"></span>
                            執行</asp:LinkButton>

                                    </p>
                                    <p class="form-control-static">
                                        <asp:Label ID="recover_msg" runat="server" ForeColor="Red"></asp:Label>
                                    </p>
                                </div>
                            </div>


                        </div>

                    </asp:Panel>


                </ContentTemplate>
            </asp:UpdatePanel>



        </div>


    </asp:Panel>





    <!-- /.content_box -->

</asp:Content>

