<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="reg.aspx.cs" Inherits="admin_user_reg" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <script src="../../App_Script/CustomValidator.js"></script>
    <script type="text/javascript"> 
        //密碼格式驗證
        function ClientValidate(source, arguments) {
            if (PwdValidator(arguments.Value) && SpecialSymbolsValidator(arguments.Value)) {
                arguments.IsValid = true;
            } else {
                arguments.IsValid = false;
            }
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

    <div class="content_box">


        <div class="panel panel-default">
            <div class="panel-heading">以下 * 欄位為必填欄位</div>
            <asp:Panel ID="Panel1" runat="server" CssClass="panel-body form-horizontal" role="form" DefaultButton="submitButton">

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 帳號</label>
                    <div class="col-sm-9  col-md-10">

                        <asp:PlaceHolder ID="PlaceHolder1" runat="server">
                            <input type="text" class="form-control" id="u_id" runat="server" placeholder="帳號" maxlength="25" />
                            <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="u_id" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                            <div>建立後將無法變更</div>
                        </asp:PlaceHolder>
                        <asp:Literal ID="u_id2" runat="server"></asp:Literal>
                    </div>
                </div>


                <asp:PlaceHolder ID="PlaceHolder2" runat="server">
                    <div class="form-group">
                        <label class="col-sm-3 col-md-2 control-label">* 密碼</label>
                        <div class="col-sm-9  col-md-10">
                            <input type="password" class="form-control" id="u_password" runat="server" placeholder="密碼" maxlength="20" />
                            <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="u_password" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                            <asp:CustomValidator ID="CustomValidator1" ClientValidationFunction="ClientValidate" runat="server" ErrorMessage="不符合密碼原則" ValidationGroup="Required" Display="Dynamic" ControlToValidate="u_password" SetFocusOnError="True"></asp:CustomValidator>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-sm-3 col-md-2 control-label">* 確認密碼</label>
                        <div class="col-sm-9  col-md-10">
                            <input type="password" class="form-control" id="u_password2" runat="server" placeholder="密碼" maxlength="20" />
                            <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="u_password2" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                            <asp:CompareValidator ID="PasswordCompare" runat="server" ControlToCompare="u_password" ControlToValidate="u_password2" ErrorMessage="與密碼必須相符" Display="Dynamic" ValidationGroup="Required" SetFocusOnError="true"></asp:CompareValidator>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-sm-3 col-md-2 control-label">密碼原則</label>
                        <div class="col-sm-9  col-md-10">
                            <p class="form-control-static">
                                <ol>
                                    <li>10個字元以上20個字元以下且不得與前5次相同。</li>
                                    <li>勿循環性密碼如(wxy1234, wxy2345,...)。</li>
                                    <li>英文大寫、英文小寫、數字及特殊符號且第一個字元與最後一個字元請勿使用特殊符號。</li>
                                    <li>連續輸入錯誤密碼3次上鎖15分鐘。</li>
                                </ol>
                            </p>
                        </div>
                    </div>
                </asp:PlaceHolder>

                <asp:PlaceHolder ID="PlaceHolder3" runat="server" Visible="false">
                    <asp:Panel ID="Panel2" runat="server" DefaultButton="changePassButton">
                        <div class="form-group">
                            <label class="col-sm-3 col-md-2 control-label">* 密碼</label>
                            <div class="col-sm-9  col-md-10">
                                <input type="password" class="form-control" id="new_password" runat="server" placeholder="密碼" maxlength="25" />
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator6" runat="server" ControlToValidate="new_password" ValidationGroup="Required2" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>

                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 col-md-2 control-label">* 確認密碼</label>
                            <div class="col-sm-9  col-md-10">
                                <input type="password" class="form-control" id="new_password2" runat="server" placeholder="密碼" maxlength="25" />
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator7" runat="server" ControlToValidate="new_password2" ValidationGroup="Required2" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToCompare="new_password" ControlToValidate="new_password2" ErrorMessage="與密碼必須相符" Display="Dynamic" ValidationGroup="Required2" SetFocusOnError="true"></asp:CompareValidator>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">
                                <asp:Button ID="changePassButton" runat="server" Text="變更密碼" CssClass="btn btn-default" ValidationGroup="Required2" OnClick="changeButton_Click" />
                                <asp:Label ID="msg2" runat="server" ForeColor="Red"></asp:Label>
                            </div>
                        </div>
                    </asp:Panel>
                </asp:PlaceHolder>

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 使用者名稱</label>
                    <div class="col-sm-9  col-md-10">

                        <input type="text" class="form-control" id="u_name" runat="server" placeholder="使用者名稱" maxlength="25" />
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="u_name" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>

                    </div>
                </div>

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* E-mail</label>
                    <div class="col-sm-9  col-md-10">
                        <input type="text" class="form-control" id="email" runat="server" placeholder="E-mail" maxlength="100" />
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator8" ControlToValidate="email" ErrorMessage="必填" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" runat="server"></asp:RequiredFieldValidator>
                        <asp:RegularExpressionValidator ControlToValidate="email" Display="Dynamic" ErrorMessage="格式不正確" ID="RegularExpressionValidator1" ValidationGroup="Required" SetFocusOnError="true" runat="server" ValidationExpression="\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*" />
                    </div>
                </div>

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 群組</label>
                    <div class="col-sm-9  col-md-10">

                        <asp:DropDownList ID="power" runat="server" CssClass="form-control">
                            <asp:ListItem></asp:ListItem>
                        </asp:DropDownList>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator5" runat="server" ControlToValidate="power" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>

                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 狀態</label>
                    <div class="col-sm-9  col-md-10">

                        <asp:RadioButtonList ID="online" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow">
                            <asp:ListItem Value="1" Text="啟用" Selected="True"></asp:ListItem>
                            <asp:ListItem Value="0" Text="停用"></asp:ListItem>
                        </asp:RadioButtonList>

                    </div>
                </div>

                <asp:PlaceHolder ID="PlaceHolder4" runat="server" Visible="false">
                    <div class="form-group">
                        <label class="col-sm-3 col-md-2 control-label">有效日期</label>
                        <div class="col-sm-9  col-md-10">

                            <input type="text" class="datepicker form-control" id="effective_date" runat="server" data-date-format="yyyy-mm-dd" placeholder="選擇日期" style="width: 120px" />

                        </div>
                    </div>
                </asp:PlaceHolder>

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">WRP訊息</label>
                    <div class="col-sm-9  col-md-10">
                        <p class="form-control-static">
                            <asp:CheckBox ID="wrp_news" runat="server" Text="啟用" Checked="true" />
                            (登入後首頁顯示WRP訊息)
                        </p>
                    </div>
                </div>

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">備註</label>
                    <div class="col-sm-9  col-md-10">
                        <asp:TextBox ID="demo" runat="server" TextMode="MultiLine" CssClass="form-control" Rows="5"></asp:TextBox>
                    </div>
                </div>


                <div class="form-group">
                    <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">
                        <asp:HiddenField ID="mode" runat="server" />
                        <asp:Button ID="submitButton" runat="server" Text="送出" CssClass="btn btn-default" ValidationGroup="Required" OnClick="submitButton_Click" />
                        <asp:HyperLink ID="goBack" runat="server" CssClass="btn btn-default" Visible="false">返回</asp:HyperLink>
                        <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                    </div>
                </div>
            </asp:Panel>
        </div>


    </div>
    <!-- /.content_box -->

</asp:Content>

