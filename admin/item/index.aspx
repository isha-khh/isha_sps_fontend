<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="index.aspx.cs" Inherits="admin_item_index" %>

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
          <div class="row">

              <div class="col-sm-4">

                  <div class="panel panel-default">
                      <div class="panel-heading">
                        <asp:LinkButton ID="addRootOption" runat="server" CssClass="btn btn-default" OnClick="addRootOption_Click">新增主選項</asp:LinkButton>                     
                       <asp:LinkButton ID="delSelect" runat="server" CssClass="btn btn-default" OnClick="delSelect_Click" OnClientClick="return msgconfirm('您確定要刪除已勾選的項目？',this)">刪除勾選項目</asp:LinkButton>
                      </div>
                      <div class="panel-heading">選擇項目 | <label><input type="checkbox" onclick="checkAll(this.checked)" /> 全選</label></div>
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
              <div class="panel-heading" id="navDiv" runat="server" visible="false"><asp:Literal ID="Literal1" runat="server"></asp:Literal></div>
                <div class="panel-heading">以下 * 欄位為必填欄位</div>
              <asp:Panel ID="Panel1" runat="server" CssClass="panel-body form-horizontal" role="form"  DefaultButton="submitButton">          
                      
                  <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">* 選項名稱</label>
                    <div class="col-sm-9  col-md-10">
                           <input type="text" class="form-control" id="title" runat="server" placeholder="選項名稱" maxlength="25" />
                        <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="title" ValidationGroup="options" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>                       
                    </div>
                 </div>

            <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">主要網址</label>
                    <div class="col-sm-9  col-md-10">
                           <input type="text" class="form-control" id="url" runat="server" placeholder="選項網址" maxlength="50" />
                        <div>請輸入~/admin/xxx/xxx.aspx</div>
                       </div>
                 </div>
                  <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">相關網址</label>
                    <div class="col-sm-9  col-md-10">
                           <input type="text" class="form-control" id="other_url" runat="server" placeholder="相關網址" maxlength="125" />
                               <div>請輸入~/admin/xxx/xxx.aspx，若兩個以上請間隔逗號</div>
                       </div>
                 </div>

                  <asp:Panel ID="iconPanel" runat="server" CssClass="form-group">                    
                    <label  class="col-sm-3 col-md-2 control-label">* ICON</label>
                    <div class="col-sm-9  col-md-10">
                           
                       <input type="text" class="form-control" id="icon" runat="server" placeholder="CSS名稱" maxlength="20" />
                        
                           <div><a href="../skin/ezweb-admin-icons/demo.html" target="_blank">參考CSS名稱請點擊此連結</a></div>
                       </div>
                 </asp:Panel>  

             <asp:Panel ID="sidPanel" runat="server" CssClass="form-group">     
                    <label  class="col-sm-3 col-md-2 control-label">頁籤代號</label>
                    <div class="col-sm-9  col-md-10">
                           <input type="text" class="form-control" id="s_id" runat="server" placeholder="頁籤代號" maxlength="10" />
                               <div>
                                   如果有在 選項管理系統 / 後台資料設定 裡增加系統設定的頁籤，需指定不可重複的頁籤代號
                            </div>
                       </div>
                  </asp:Panel>


                  <asp:PlaceHolder ID="PlaceHolder1" runat="server">
                       <div class="form-group">
                               <label  class="col-sm-3 col-md-2 control-label">模組編號</label>
                    <div class="col-sm-9  col-md-10">
                           <input type="text" class="form-control" id="part_no" runat="server" placeholder="模組編號" maxlength="20" />            
                               
                         <div>
                                   需設定才能從WRP取得操作手冊
                            </div>      
                          
                       </div>
                           </div>
                         <div class="form-group">
                               <label  class="col-sm-3 col-md-2 control-label">章節</label>
                    <div class="col-sm-9  col-md-10">
                           <input type="text" class="form-control" id="chapter" runat="server" placeholder="章節" maxlength="6" />
                               <asp:RegularExpressionValidator ControlToValidate="chapter" Display="Dynamic" ErrorMessage="請輸入數字！" SetFocusOnError="true" ValidationGroup="options" ID="RegularExpressionValidator11" runat="server" ValidationExpression="^[0-9]+$" />
                             
                              <div>
                                   需設定才能從WRP取得操作手冊
                            </div>     

                       </div>
                           </div>
                  </asp:PlaceHolder>

                 
                 <div class="form-group">
                    <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">

                           <asp:HiddenField ID="mode" runat="server" />
                        <asp:Button ID="submitButton" runat="server" Text="送出" CssClass="btn btn-default"  ValidationGroup="options" OnClick="submitButton_Click"  />
                        <asp:Button ID="addSubOption" runat="server" Text="建立下一層" CssClass="btn btn-default" Visible="false"  CausesValidation="false" OnClick="addSubOption_Click" /> 
                        <asp:Button ID="del" runat="server" Text="刪除" CssClass="btn btn-default"  CausesValidation="false" Visible="false" OnClick="del_Click" OnClientClick="return msgconfirm('您確定要刪除？',this)" /> 
                         <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>                
                    </div>
                 </div>
              </asp:Panel>
          </div>


</asp:Panel>
            

            </div>
      </div><!-- /.content_box -->

</asp:Content>

