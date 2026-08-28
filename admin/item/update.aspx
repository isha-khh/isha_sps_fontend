<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="update.aspx.cs" Inherits="admin_item_update" %>

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
                <div class="panel-heading">安裝或更新模組、樣版需花費一些時間，請耐心等候且請勿重新整理頁面，謝謝！</div>
               </div>

           <asp:Panel ID="ManuallyPanel" runat="server" CssClass="panel panel-default" Visible="false">
                  <div class="panel-heading">手動模組更新/掛載 (僅設計師模式)</div>
               <div class="panel-body form-horizontal" role="form">
                      <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">網址：</label>
                    <div class="col-sm-9  col-md-10">
                              <asp:TextBox ID="ManuallyModuleURI" runat="server" CssClass="form-control"></asp:TextBox>
                               <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="ManuallyModuleURI" ValidationGroup="ManuallyRequired" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>                       
       
                       </div>
                 </div>
                     <div class="form-group">
                    <div class="col-sm-offset-3 col-md-offset-2 col-sm-9 col-md-10">
                            <asp:LinkButton ID="ManuallyUpdateButton" runat="server" CssClass="btn btn-default" ValidationGroup="ManuallyRequired"  OnClick="ManuallyUpdateButton_Click">
                               <span class="glyphicon glyphicon-download"></span>
                            下載更新</asp:LinkButton>

                        </div>
                         </div>
                    
               </div>

           </asp:Panel>


                <div class="panel panel-default">                      
                <div class="panel-heading">系統模組更新</div>
            
                      <asp:Panel ID="Panel1" runat="server" CssClass="panel-body form-horizontal" role="form">          
                                       

                  <div class="form-group">

                    

                    <div style="display:none">
                            <asp:Literal ID="FTP_URL" runat="server"></asp:Literal>
                      <asp:Literal ID="ftpUser" runat="server"></asp:Literal>
                      <asp:Literal ID="ftpPassword" runat="server"></asp:Literal>
                    </div>
                                 

               <table class="table table-hover">
                <thead>
                    <tr>                      
                        <th style="width:20%">日期</th>  
                        <th style="width:20%">主題</th> 
                        <th style="width:40%">說明</th>
                        <th style="width:20%">更新</th>                       
                    </tr>
                </thead>
            <tbody>

  <asp:Repeater ID="Repeater1" runat="server">
      <ItemTemplate>
                 <tr>        
                        <td>
                            <p class="form-control-static">
                                <%#Eval("uptime") %>
                            </p>
                        </td> 
                       <td>
                             <p class="form-control-static">
                           <%#Eval("subject") %>                                 
                            </p>                         
                        </td> 
                        <td style="text-align:left">                          
                             <p class="form-control-static">
                           <%#Eval("word") %>                                 
                            </p>
                        </td> 
                     <td>
                             <p class="form-control-static">

                                 <asp:HiddenField ID="url" runat="server" Value='<%#Eval("url") %>' />

                            <asp:LinkButton ID="updateButton" runat="server" CssClass="btn btn-default" OnClick="updateButton_Click">
                            <span class="glyphicon glyphicon-download"></span>
                            下載更新</asp:LinkButton>

                            </p>
                        </td> 
                    </tr>
      </ItemTemplate>
  </asp:Repeater>
               
                <asp:PlaceHolder ID="PlaceHolder1" runat="server">                
                <tr>
                    <td colspan="4">
                              無更新資料
                    </td>
                </tr>     
                   </asp:PlaceHolder>   

                </tbody>
              </table>
                    </div>

                    

                  </asp:Panel>
               
                                     </div>

           <asp:PlaceHolder ID="PlaceHolder2" runat="server" Visible ="false">
                <div class="panel panel-default">                      
                <div class="panel-heading">錯誤說明</div>
                     <div class="form-group" style="padding:10px">
                          
                           <asp:Label ID="Label1" ForeColor="Red" runat="server"></asp:Label>
                          
                         </div>
                    </div>
           </asp:PlaceHolder>
      
         

      </div>

</asp:Content>

