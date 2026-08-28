<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="reg.aspx.cs" ValidateRequest="false" Inherits="admin_pro_reg" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
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



                <asp:Panel ID="nationPanel" runat="server" CssClass="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 語系</label>
                    <div class="col-sm-9  col-md-10">
                        <asp:DropDownList ID="nation" runat="server" CssClass="form-control">
                            <asp:ListItem></asp:ListItem>
                        </asp:DropDownList>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="nation" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>

                    </div>
                </asp:Panel>

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 分類</label>
                    <div class="col-sm-9  col-md-10">
                        <asp:DropDownList ID="kind" runat="server" CssClass="form-control">
                            <asp:ListItem></asp:ListItem>
                        </asp:DropDownList>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator8" runat="server" ControlToValidate="kind" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 電器名稱</label>
                    <div class="col-sm-9  col-md-10">

                        <input type="text" class="form-control" id="subject" runat="server" placeholder="電器名稱" maxlength="100" />
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator4" runat="server" ControlToValidate="subject" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>

                    </div>
                </div>

                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 用電比例</label>
                    <div class="col-sm-9  col-md-10">
                        <input type="text" class="form-control" id="use_value" runat="server" placeholder="用電比例" maxlength="25" style="width: 120px; display: inline;" />
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="use_value" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                        <asp:RegularExpressionValidator ControlToValidate="use_value" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required" ID="RegularExpressionValidator3" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" />
                        <p class="form-control-static" style="display: inline;">%</p>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 狀態</label>
                    <div class="col-sm-9  col-md-10">
                        <p class="form-control-static">
                            <asp:RadioButtonList ID="status" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow"></asp:RadioButtonList>
                        </p>
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

