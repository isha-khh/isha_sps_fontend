<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="forget.aspx.cs" Inherits="admin_forget" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <%=recaptcha.Used ? recaptcha.HeaderCode():"" %>
    <script type="text/javascript">
        /*頁面個別的script*/
        $(document).ready(function () {

        });
    </script>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder" runat="Server">

    <div class="title row">
        <div class="col-sm-8 col-xs-7 login-center">
            <h1>
                <asp:Literal ID="com_name" runat="server"></asp:Literal> 忘記密碼</h1>
        </div>
        <div class="col-sm-4 col-xs-5">
            <ol class="breadcrumb pull-right hidden-login">
                <li><span class="glyphicon glyphicon-home"></span></li>
            </ol>
        </div>
    </div>
    <!-- /.title row -->

    <div class="content_box">

        <asp:Panel ID="loginPanel" CssClass="form-signin" role="form" runat="server" DefaultButton="login">

            <div class="form-group">
                <label for="user_id">使用者帳號</label>
                <input type="text" class="form-control" id="u_id" runat="server" placeholder="輸入帳號" />
                <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="u_id" ValidationGroup="login" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
            </div>
            <div class="form-group">
                <label for="user_id">E-mail</label>
                <input type="text" class="form-control" id="email" runat="server" placeholder="E-mail" />
                <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="email" ValidationGroup="login" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>                
                <asp:RegularExpressionValidator ControlToValidate="email" Display="Dynamic" ErrorMessage="格式不正確" ID="RegularExpressionValidator1" ValidationGroup="login" SetFocusOnError="true" runat="server" ValidationExpression="\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*" />
            </div>
            <asp:MultiView ID="MultiView1" runat="server" ActiveViewIndex="0">
                <asp:View ID="View1" runat="server">
                    <div class="form-group">
                        <label for="captcha">驗證碼</label>
                        <div class="row">
                            <div class="col-xs-6">
                                <input type="text" class="form-control" id="captcha" runat="server" placeholder="輸入驗證碼" />
                                <asp:RequiredFieldValidator ID="RequiredFieldValidator3" runat="server" ControlToValidate="captcha" ValidationGroup="login" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                            </div>
                            <div class="col-xs-6">
                                <a href="javascript:void(0)" onclick="$('#chkImg').attr('src','../App_Script/chksum.ashx?key=adminchk&c=' + $('#chkCount').val()); $('#chkCount').val(parseInt($('#chkCount').val())+1)">
                                    <img id="chkImg" src="../App_Script/chksum.ashx?key=adminchk" />
                                </a>
                                <input id="chkCount" type="hidden" value="0" />
                            </div>
                        </div>
                    </div>
                </asp:View>
                <asp:View ID="View2" runat="server">
                    <div class="form-group">
                        <%=recaptcha.Used ? recaptcha.Embed():"" %>
                    </div>
                </asp:View>
            </asp:MultiView>
            <asp:Button ID="login" runat="server" Text="送出" CssClass="btn btn-lg btn-normal btn-block" ValidationGroup="login" OnClick="login_Click" />
            <asp:Button ID="goback" runat="server" Text="返回" CssClass="btn btn-lg btn-normal btn-block" OnClick="goback_Click" />
            <div style="text-align: center; width: 100%">
                <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
            </div>

        </asp:Panel>

    </div>
    <!-- /.content_box -->

</asp:Content>

