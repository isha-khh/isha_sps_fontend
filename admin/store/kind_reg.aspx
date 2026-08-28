<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="kind_reg.aspx.cs" ValidateRequest="false" Inherits="admin_pro_kind_reg" %>

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
        <div class="row">

            <div class="col-sm-4">

                <div class="panel panel-default">
                    <asp:Panel ID="nationPanel" runat="server" CssClass="panel-heading">
                        <asp:DropDownList ID="nation" runat="server" CssClass="form-control" AutoPostBack="true" OnSelectedIndexChanged="nation_SelectedIndexChanged"></asp:DropDownList>
                    </asp:Panel>
                    <div class="panel-heading">
                        <asp:LinkButton ID="addRootOption" runat="server" CssClass="btn btn-default" OnClick="addRootOption_Click">新增分類</asp:LinkButton>
                    </div>
                    <div class="panel-heading">選擇項目</div>
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
                            <label class="col-sm-3 col-md-2 control-label">* 選項名稱</label>
                            <div class="col-sm-9  col-md-10">
                                <input type="text" class="form-control" id="kind" runat="server" placeholder="選項名稱" maxlength="50" />
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="kind" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
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
                            <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">

                                <asp:HiddenField ID="mode" runat="server" />
                                <asp:Button ID="submitButton" runat="server" Text="送出" CssClass="btn btn-default" ValidationGroup="Required" OnClick="submitButton_Click" />
                                <asp:Button ID="addSubOption" runat="server" Text="建立下一層" CssClass="btn btn-default" Visible="false" CausesValidation="false" OnClick="addSubOption_Click" />
                                <asp:Button ID="del" runat="server" Text="刪除" CssClass="btn btn-default" CausesValidation="false" Visible="false" OnClick="del_Click" OnClientClick="return msgconfirm('您確定要刪除？',this)" />
                                <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                            </div>
                        </div>
                    </asp:Panel>
                </div>


            </asp:Panel>


        </div>
    </div>
    <!-- /.content_box -->

</asp:Content>

