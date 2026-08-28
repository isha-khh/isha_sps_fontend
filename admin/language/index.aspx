<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="index.aspx.cs" ValidateRequest="false" Inherits="admin_language_index" %>

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
      

                <div class="panel panel-default">                      
                <div class="panel-heading">修改完後請記得按 <asp:Button ID="submitButton" runat="server" Text="儲存" CssClass="btn btn-default" OnClick="submitButton_Click"   /></div>
              <asp:Panel ID="Panel1" runat="server" CssClass="panel-body form-horizontal" role="form"  DefaultButton="submitButton">          

                     <asp:Panel ID="nationPanel" runat="server" CssClass="form-group"> 
                          <label class="col-sm-2 control-label" >語系</label>
                    <div class="col-sm-10">
                         <asp:DropDownList ID="nation" runat="server" CssClass="form-control" AutoPostBack="true" OnSelectedIndexChanged="nation_SelectedIndexChanged">
                             <asp:ListItem></asp:ListItem>
                         </asp:DropDownList>
                    </div>                        
                    </asp:Panel>

                  <div class="form-group">
                      <asp:Label ID="msg" ForeColor="Red" runat="server"></asp:Label>
                            <table class="table table-hover">
                <thead>
                    <tr>                      
                        <th style="width:30%">文字</th>  
                        <th style="width:70%">翻譯</th>                        
                    </tr>
                </thead>
                <tbody>

  <asp:Repeater ID="Repeater1" runat="server">
      <ItemTemplate>
                 <tr>        
                        <td style="text-align:right">
                            <p class="form-control-static">
                                <asp:Literal ID="name" runat="server" Text='<%#Eval("name") %>'></asp:Literal>
                            ：
                                </p>
                        </td> 
                        <td style="text-align:left">
                            <asp:TextBox ID="value" runat="server" CssClass="form-control" Text='<%#ValString(Eval("value")) %>'></asp:TextBox>
                                     <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="value" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>                       

                        </td> 
                    </tr>
      </ItemTemplate>
  </asp:Repeater>
                                       
                   
                </tbody>
              </table>
                    </div>

                  </asp:Panel>
                        <div class="panel-heading">修改完後請記得按 <asp:Button ID="submitButton2" runat="server" Text="儲存" CssClass="btn btn-default" OnClick="submitButton_Click"  /></div>
                    </div>
      
         

      </div><!-- /.content_box -->

</asp:Content>

