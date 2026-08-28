<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="reg.aspx.cs" ValidateRequest="false" Inherits="admin_pro_reg" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">

    <link href="../../App_Script/lightbox/css/lightbox.css" rel="stylesheet" />
    <script src="../../App_Script/lightbox/js/lightbox.min.js"></script>

    <style type="text/css">
        .uploadDiv {
            margin: 5px;
            padding: 5px;
            float: left;
            height: 180px;
            border: 1px solid silver;
        }
    </style>

    <!--編緝器-->
    <script type="text/javascript" src="<%=ResolveUrl("~/admin/ckeditor/ckeditor.js") %>"></script>
    <script type="text/javascript">
        CKEDITOR.config.toolbar = 'Default';
    </script>
    <!--編緝器-->


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
                        <asp:DropDownList ID="nation" runat="server" CssClass="form-control" AutoPostBack="true" OnSelectedIndexChanged="nation_SelectedIndexChanged">
                            <asp:ListItem></asp:ListItem>
                        </asp:DropDownList>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="nation" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>

                    </div>
                </asp:Panel>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 電器名稱</label>
                    <div class="col-sm-9  col-md-10">

                        <asp:DropDownList ID="app" runat="server" CssClass="form-control">
                            <asp:ListItem></asp:ListItem>
                        </asp:DropDownList>
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="app" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>

                    </div>
                </div>



                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">說明</label>
                    <div class="col-sm-9  col-md-10">
                        <input type="text" class="form-control" id="description" runat="server" placeholder="說明" />
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">電器耗電比較</label>
                    <div class="col-sm-9  col-md-10">
                        <asp:TextBox ID="word2" runat="server" TextMode="MultiLine" CssClass="ckeditor" Rows="5"></asp:TextBox>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">行動處方</label>
                    <div class="col-sm-9  col-md-10">
                        <asp:TextBox ID="word" runat="server" TextMode="MultiLine" CssClass="ckeditor" Rows="5"></asp:TextBox>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">處方箋小語</label>
                    <div class="col-sm-9  col-md-10">
                        <asp:TextBox ID="word3" runat="server" TextMode="MultiLine" CssClass="ckeditor" Rows="5"></asp:TextBox>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 col-md-2 control-label">用電度數</label>
                    <div class="col-sm-9  col-md-10">
                        <input type="text" class="form-control" id="kwh" runat="server" placeholder="用電度數" maxlength="25" style="width: 120px" />
                        <asp:RegularExpressionValidator ControlToValidate="kwh" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required" ID="RegularExpressionValidator3" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" />
                        <p class="form-control-static">(度/年)</p>
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

                <asp:Panel ID="picPanel" runat="server" CssClass="form-group">
                    <label class="col-sm-3 col-md-2 control-label">圖片</label>
                    <div class="col-sm-9  col-md-10">

                        <asp:Repeater ID="picRepeater" runat="server" OnItemDataBound="picRepeater_ItemDataBound">
                            <ItemTemplate>
                                <div class="uploadDiv">
                                    <asp:FileUpload ID="FileUpload1" runat="server" />
                                    <asp:CheckBox ID="delpic" runat="server" Visible="false" Text="刪除圖片" />
                                    <asp:HiddenField ID="pic" runat="server" Value='<%#Eval("pic") %>' />
                                    <div>
                                        <asp:HyperLink ID="HyperLink1" runat="server" data-lightbox="roadtrip" Visible="false">
                                            <asp:Image ID="Image1" runat="server" Style="margin: 5px; width: 100px" />
                                        </asp:HyperLink>
                                    </div>
                                </div>
                            </ItemTemplate>
                        </asp:Repeater>

                        <div style="clear: both"></div>
                    </div>
                </asp:Panel>


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

