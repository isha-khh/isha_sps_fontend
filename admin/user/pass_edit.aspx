<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="pass_edit.aspx.cs" Inherits="admin_user_pass_edit" %>

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
                        <asp:Literal ID="u_id" runat="server"></asp:Literal>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 使用者名稱</label>
                    <div class="col-sm-9  col-md-10">

                        <asp:Literal ID="u_name" runat="server"></asp:Literal>
                    </div>
                </div>

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 密碼</label>
                    <div class="col-sm-9  col-md-10">
                        <input type="password" class="form-control" id="new_password" runat="server" placeholder="密碼" maxlength="25" />
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator6" runat="server" ControlToValidate="new_password" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                        <asp:CustomValidator ID="CustomValidator1" ClientValidationFunction="ClientValidate" runat="server" ErrorMessage="不符合密碼原則" ValidationGroup="Required" Display="Dynamic" ControlToValidate="new_password" SetFocusOnError="True"></asp:CustomValidator>
                    </div>
                </div>

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 確認密碼</label>
                    <div class="col-sm-9  col-md-10">
                        <input type="password" class="form-control" id="new_password2" runat="server" placeholder="密碼" maxlength="25" />
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator7" runat="server" ControlToValidate="new_password2" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                        <asp:CompareValidator ID="CompareValidator1" runat="server" ControlToCompare="new_password" ControlToValidate="new_password2" ErrorMessage="與密碼必須相符" Display="Dynamic" ValidationGroup="Required" SetFocusOnError="true"></asp:CompareValidator>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">密碼原則</label>
                    <div class="col-sm-9  col-md-10">
                        <p class="form-control-static">
                            <ol>
                                <li>15個字元以上24個字元以下且不得與前5次相同。</li>
                                <li>勿循環性密碼如(wxy1234, wxy2345,...)。</li>
                                <li>英文大寫、英文小寫、數字及特殊符號且第一個字元與最後一個字元請勿使用特殊符號。</li>
                                <li>最長效期(70天前提醒、90天未更改密碼帳號上鎖)及最短效期(1天)。</li>
                                <li>連續輸入錯誤密碼3次上鎖15分鐘。</li>
                            </ol>
                        </p>
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">

                        <asp:Button ID="submitButton" runat="server" Text="變更密碼" CssClass="btn btn-default" ValidationGroup="Required" OnClick="submitButton_Click" />
                        <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                    </div>
                </div>
            </asp:Panel>
        </div>


    </div>
    <!-- /.content_box -->

</asp:Content>

