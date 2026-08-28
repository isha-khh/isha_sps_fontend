<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="kind_reg.aspx.cs" ValidateRequest="false" Inherits="admin_language_reg" %>


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

                    <asp:Panel ID="addRootPanel" runat="server" CssClass="panel-heading">
                        <asp:LinkButton ID="addRootOption" runat="server" CssClass="btn btn-default" OnClick="addRootOption_Click">新增語系</asp:LinkButton>
                    </asp:Panel>
                    <div class="panel-heading">選擇語系</div>
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
                            <label class="col-sm-3 col-md-2 control-label">* 代碼</label>
                            <div class="col-sm-9  col-md-10">
                                <input type="text" class="form-control" id="code" runat="server" placeholder="請使用英文大寫 (代碼新增後將無法變更)" maxlength="2" />
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="code" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                <p class="form-control-static">
                                    說明：限用英文大寫，不得使用空格及符號 (代碼新增後將無法變更)
                                </p>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 col-md-2 control-label">* 語系名稱</label>
                            <div class="col-sm-9  col-md-10">
                                <input type="text" class="form-control" id="lang_name" runat="server" placeholder="語系名稱" maxlength="25" />
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="lang_name" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 col-md-2 control-label">* 語系簡稱</label>
                            <div class="col-sm-9  col-md-10">
                                <input type="text" class="form-control" id="country" runat="server" placeholder="語系簡稱" maxlength="25" />
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="country" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 col-md-2 control-label">網址名稱</label>
                            <div class="col-sm-9  col-md-10">
                                <input type="text" class="form-control" id="url" runat="server" placeholder="網址名稱" maxlength="100" />
                                <p class="form-control-static">
                                    說明：如果有設定，則前台將會自動判斷語系，若您的網站只有一個網址，則請勿填寫，系統將會由使用者自行切換。<br />
                                    例如：https://www.eztrust.com.tw
                                </p>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 col-md-2 control-label">語系對應</label>
                            <div class="col-sm-9  col-md-10">
                                <input type="text" class="form-control" id="other_codes" runat="server" placeholder="語系對應" />
                                <p class="form-control-static">
                                    說明：偵測瀏覽器語系，自動切換，請填入瀏覽器的語系代碼，如果多個請以逗號區隔。<br />
                                    例如：zh-TW,zh-CN，請參考<a href="code.html" target="_blank">瀏覽器語系代碼表</a>
                                </p>
                            </div>
                        </div>

                        <asp:Panel ID="nationPanel" runat="server" CssClass="form-group">
                            <label class="col-sm-3 col-md-2 control-label">語系範本</label>
                            <div class="col-sm-9  col-md-10">
                                <asp:DropDownList ID="nation" runat="server" CssClass="form-control"></asp:DropDownList>
                                <p class="form-control-static">
                                    說明：前台的語系相關文字將會使用您選的語系為範本，您再至「語系文字修改」更新您的翻譯。
                                </p>
                            </div>
                        </asp:Panel>

                        <div class="form-group">
                            <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">

                                <asp:HiddenField ID="mode" runat="server" />
                                <asp:Button ID="submitButton" runat="server" Text="送出" CssClass="btn btn-default" ValidationGroup="Required" OnClick="submitButton_Click" />
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

