<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="pro_type.aspx.cs" Inherits="admin_pro_type" ValidateRequest="false" %>

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
        <div class="row">

            <div class="panel panel-default">
                <div class="panel-heading">
                    <div style="float: left">
                        <asp:Literal ID="pro_name" runat="server"></asp:Literal>
                    </div>
                    <div style="float: right">
                        <asp:LinkButton ID="ClearButton" runat="server" CssClass="btn btn-default" OnClick="ClearButton_Click" OnClientClick="return confirm('您確定要將電器推薦全部清空？')">清除電器推薦</asp:LinkButton>
                        |
                    <asp:HyperLink ID="goback1" runat="server" CssClass="btn btn-default">回資料頁</asp:HyperLink>
                        <asp:HyperLink ID="goback2" runat="server" CssClass="btn btn-default">回列表頁</asp:HyperLink>
                    </div>
                    <div style="clear: both"></div>
                </div>
                <div class="panel-body form-horizontal" role="form">



                    <div class="col-sm-4">

                        <div class="panel panel-default">

                            <div class="panel-heading">
                                <asp:LinkButton ID="addRootOption" runat="server" CssClass="btn btn-default" OnClick="addRootOption_Click">新增電器推薦</asp:LinkButton>

                                <asp:HiddenField ID="nation" runat="server" />
                            </div>
                            <div class="panel-heading">選擇電器推薦</div>
                            <div class="panel-body">
                                <ul class="list-unstyled">

                                    <asp:TreeView ID="TreeView1" runat="server"></asp:TreeView>

                                </ul>
                            </div>

                        </div>

                    </div>

                    <asp:Panel ID="formPanel" Visible="false" runat="server" CssClass="col-sm-8">

                        <asp:HiddenField ID="HiddenField1" runat="server" />

                        <div class="panel panel-default">
                            <div class="panel-heading" id="navDiv" runat="server" visible="false">
                                <asp:Literal ID="Literal1" runat="server"></asp:Literal>
                            </div>
                            <div class="panel-heading">以下 * 欄位為必填欄位</div>
                            <asp:Panel ID="Panel1" runat="server" CssClass="panel-body form-horizontal" role="form" DefaultButton="submitButton">

                                <div class="form-group">
                                    <label class="col-sm-3 col-md-2 control-label">* 公司名稱</label>
                                    <div class="col-sm-9  col-md-10">
                                        <input type="text" class="form-control" id="kind" runat="server" placeholder="公司名稱" maxlength="100" />
                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="kind" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-sm-3 col-md-2 control-label">產品型號</label>
                                    <div class="col-sm-9  col-md-10">
                                        <input type="text" class="form-control" id="pro_num" runat="server" placeholder="產品型號" maxlength="50" />
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-sm-3 col-md-2 control-label">額定冷氣能力</label>
                                    <div class="col-sm-9  col-md-10">
                                        <input type="text" class="form-control" id="rated" runat="server" placeholder="額定冷氣能力" maxlength="5" style="width: 120px" />
                                        <asp:RegularExpressionValidator ControlToValidate="rated" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required" ID="RegularExpressionValidator1" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" />
                                        kW
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-sm-3 col-md-2 control-label">年耗電量</label>
                                    <div class="col-sm-9  col-md-10">
                                        <input type="text" class="form-control" id="electricity" runat="server" placeholder="年耗電量" maxlength="5" style="width: 120px" />
                                        <asp:RegularExpressionValidator ControlToValidate="electricity" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required" ID="RegularExpressionValidator2" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" />
                                        (度/年)
                                    </div>
                                </div>
                                <asp:Repeater ID="picRepeater" runat="server" OnItemDataBound="picRepeater_ItemDataBound">
                                    <ItemTemplate>

                                        <div class="form-group">
                                            <label class="col-sm-3 col-md-2 control-label">圖片</label>
                                            <div class="col-sm-9  col-md-10">
                                                <asp:FileUpload ID="FileUpload1" runat="server" />
                                                <asp:CheckBox ID="delpic" runat="server" Visible="false" Text="刪除圖片" />
                                                <asp:HiddenField ID="pic" runat="server" Value='<%#Eval("pic") %>' />
                                                <div>
                                                    <asp:HyperLink ID="HyperLink1" runat="server" data-lightbox="roadtrip" Visible="false">
                                                        <asp:Image ID="Image1" runat="server" Style="margin: 5px; width: 100px" />
                                                    </asp:HyperLink>
                                                </div>
                                            </div>
                                        </div>

                                    </ItemTemplate>
                                </asp:Repeater>
                                <div class="form-group">
                                    <label class="col-sm-3 col-md-2 control-label">* 排序</label>
                                    <div class="col-sm-9  col-md-10">

                                        <input type="text" class="form-control" id="range" runat="server" placeholder="排序" maxlength="5" style="width: 120px" />
                                        <asp:RegularExpressionValidator ControlToValidate="range" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required" ID="RegularExpressionValidator3" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" />
                                        <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="range" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>

                                    </div>
                                </div>

                                <div class="form-group">
                                    <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">

                                        <asp:HiddenField ID="mode" runat="server" />
                                        <asp:Button ID="submitButton" runat="server" Text="送出" CssClass="btn btn-default" ValidationGroup="Required" OnClick="submitButton_Click" />
                                        <asp:Button ID="addSubOption" runat="server" Text="建立下一層電器推薦" CssClass="btn btn-default" Visible="false" CausesValidation="false" OnClick="addSubOption_Click" />
                                        <asp:Button ID="del" runat="server" Text="刪除" CssClass="btn btn-default" CausesValidation="false" Visible="false" OnClick="del_Click" OnClientClick="return confirm('您確定要刪除？')" />
                                        <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                                    </div>
                                </div>
                            </asp:Panel>
                        </div>


                    </asp:Panel>

                </div>
            </div>

        </div>
    </div>
    <!-- /.content_box -->

</asp:Content>

