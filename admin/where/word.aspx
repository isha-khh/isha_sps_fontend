<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="word.aspx.cs" ValidateRequest="false" Inherits="admin_where_word" %>

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
                        <asp:DropDownList ID="nation" runat="server" CssClass="form-control" AutoPostBack="true" OnSelectedIndexChanged="NC_SelectedIndexChanged">
                        </asp:DropDownList>

                    </div>
                </asp:Panel>

                <asp:PlaceHolder ID="PlaceHolder1" runat="server">

                    <div class="form-group">
                        <label class="col-sm-3 col-md-2 control-label">標題</label>
                        <div class="col-sm-9  col-md-10">
                            <asp:TextBox ID="subject" runat="server" MaxLength="100" CssClass="form-control" placeholder="標題"></asp:TextBox>

                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-sm-3 col-md-2 control-label">內容</label>
                        <div class="col-sm-9  col-md-10">
                            <asp:TextBox ID="word" runat="server" TextMode="MultiLine" CssClass="form-control" Rows="5"></asp:TextBox>

                        </div>
                    </div>

                    <div class="form-group">
                        <label class="col-sm-3 col-md-2 control-label">狀態</label>
                        <div class="col-sm-9  col-md-10">
                            <p class="form-control-static">
                                <asp:RadioButtonList ID="status" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow">
                                    <asp:ListItem Text="顯示" Value="Y" Selected="True"></asp:ListItem>
                                    <asp:ListItem Text="隱藏" Value="N"></asp:ListItem>
                                </asp:RadioButtonList>
                            </p>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">

                            <asp:Button ID="submitButton" runat="server" Text="送出" CssClass="btn btn-default" OnClick="submitButton_Click" ValidationGroup="Required" />
                            <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                        </div>
                    </div>

                </asp:PlaceHolder>

            </asp:Panel>
        </div>


    </div>
    <!-- /.content_box -->

</asp:Content>

