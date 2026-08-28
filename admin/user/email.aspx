<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="email.aspx.cs" Inherits="admin_user_email" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" Runat="Server">
</asp:Content>

<asp:Content ID="Content3" ContentPlaceHolderID="breadcrumb_holder" Runat="Server">
    <ol class="breadcrumb">
        <li><a href="../index2.aspx"><span class="ezicon ezicon-home"></span></a></li>
        <li><%=loginInfo.menuRootName %></li>
        <li class="active"><%=loginInfo.menuSubName %></li>
    </ol>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder" Runat="Server">

      <div class="content_box">
            <asp:Panel ID="Panel2" runat="server" CssClass="panel panel-default" DefaultButton="editButton">
        
              <div class="panel-heading">基本資料設定</div>

                <div class="panel-body form-horizontal" role="form">
        
                   <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">* 公司信箱</label>
                    <div class="col-sm-10">
                        <p class="form-control-static">

                                <input type="text" class="form-control" id="com_mail" runat="server" placeholder="公司信箱" maxlength="100" />
                                  <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="com_mail" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                        <asp:RegularExpressionValidator ControlToValidate="com_mail" Display="Dynamic" SetFocusOnError="true" ErrorMessage="格式有誤" ID="RegularExpressionValidator1" runat="server" ValidationExpression="\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*" />
                        </p>
                    </div>
                 </div>

                     <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">BCC</label>
                    <div class="col-sm-10">
                        <p class="form-control-static">
                            (說明：設定密件請一行輸入一個E-mail。)<br />
                                <asp:TextBox id="bcc_mail" TextMode="MultiLine" Height="100" runat="server" CssClass="form-control"></asp:TextBox>

                                  </p>
                    </div>
                 </div>
          

                        <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <asp:LinkButton ID="editButton" runat="server" CssClass="btn btn-default" ValidationGroup ="Required" OnClick="editButton_Click">送出</asp:LinkButton>
                        <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                    </div>
                 </div>

        </div>

                    

           </asp:Panel>
      </div><!-- /.content_box -->

</asp:Content>

