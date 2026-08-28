<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="group_reg.aspx.cs" Inherits="admin_user_group_reg" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" Runat="Server">

     <script type="text/javascript">
          $(window).ready(function () {
                   var chk = $('#treeArea input[type=checkbox]');
                   for (i = 0; i < chk.length; i++){
                       var t = $(chk[i]).attr('title').split('-');
                       $(chk[i]).attr('title', '');
                       $(chk[i]).attr('root', t[0]);
                       $(chk[i]).attr('num', t[1]);
                   }

                   $("#treeArea input[type=checkbox]").bind("click", function () {                     
                         var root = $(this).attr('root');
                       var num = $(this).attr('num');
                       
                       if (root == "0") {
                             var chk = $('#treeArea input[type=checkbox]');
                             for (i = 0; i < chk.length; i++){
                                 if ($(chk[i]).attr('root') == num) {
                                      $(chk[i]).prop( "checked", this.checked );                            
                                 }
                              }                             
                       }else if (root != "0") {
                             var chk = $('#treeArea input[type=checkbox]');
                             for (i = 0; i < chk.length; i++){
                                 if ($(chk[i]).attr('num') == root) {
                                     if (this.checked) {
                                         $(chk[i]).prop("checked", this.checked);
                                     } else {
                                         var n = 0;
                                         for (ii = 0; ii < chk.length; ii++) {
                                             if ($(chk[ii]).attr('root') == root && $(chk[ii]).is( ":checked" )) { n++; }
                                         }
                                         if (n ==0) {
                                             $(chk[i]).prop("checked", this.checked);
                                         }
                                     }                                 
                                     break;
                                 }
                              }                             
                       }

                    });
               });
     </script>

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
          <div class="row">

              <div class="col-sm-4">

                  <div class="panel panel-default">
                  
                      <div class="panel-heading">選擇項目 | <label><input type="checkbox" onclick="checkAll(this.checked)" /> 全選</label></div>
                      <div class="panel-body">
                        <ul class="list-unstyled" id="treeArea">

                            <asp:TreeView ID="TreeView1" runat="server"></asp:TreeView>

                        </ul>

                            

                      </div>
                  </div>

                </div>

<asp:Panel ID="formPanel" runat="server" CssClass="col-sm-8">

    
          <div class="panel panel-default">            
              <div class="panel-heading" id="navDiv" runat="server" visible="false"><asp:Literal ID="Literal1" runat="server"></asp:Literal></div>
                <div class="panel-heading">以下 * 欄位為必填欄位</div>
              <asp:Panel ID="Panel1" runat="server" CssClass="panel-body form-horizontal" role="form"  DefaultButton="submitButton">          
                      
                  <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">* 群組代號</label>
                    <div class="col-sm-9  col-md-10">

                        <asp:PlaceHolder ID="PlaceHolder1" runat="server">
                           <input type="text" class="form-control" id="g_name" runat="server" placeholder="群組代號" maxlength="3" />
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="g_name" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>                       
                        <div>建立後將無法變更</div>
                        </asp:PlaceHolder>
                        <asp:Literal ID="g_name2" runat="server"></asp:Literal>
                         </div>
                 </div>

            <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">群組說明</label>
                    <div class="col-sm-9  col-md-10">
                           <input type="text" class="form-control" id="demo" runat="server" placeholder="群組說明" maxlength="50" />
                     
                       </div>
                 </div>
                  
                 
                 <div class="form-group">
                    <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">
                        <asp:HiddenField ID="items" runat="server" />
                           <asp:HiddenField ID="mode" runat="server" />
                        <asp:Button ID="submitButton" runat="server" Text="送出" CssClass="btn btn-default"  ValidationGroup="Required" OnClick="submitButton_Click"  />
                        <asp:HyperLink ID="goBack" runat="server" CssClass="btn btn-default" Visible="false">返回</asp:HyperLink>
                         <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>                
                    </div>
                 </div>
              </asp:Panel>
          </div>


</asp:Panel>
            

            </div>
      </div><!-- /.content_box -->

</asp:Content>

