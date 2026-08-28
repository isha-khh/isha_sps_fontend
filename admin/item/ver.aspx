<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="ver.aspx.cs" Inherits="admin_item_ver" %>

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
                <div class="panel-heading">系統版本查詢</div>
            
                      <asp:Panel ID="Panel1" runat="server" CssClass="panel-body form-horizontal" role="form">          

             
                  <div class="form-group">
                  
                            <table class="table table-hover">
                <thead>
                    <tr>     
                        <th style="width:5%">顯示</th>                  
                        <th style="width:30%">系統</th>  
                        <th style="width:30%">版本</th>  
                        <th style="width:35%">路徑</th>                       
                    </tr>
                </thead>
                <tbody>

                    

                   
  <asp:Repeater ID="Repeater1" runat="server" OnItemDataBound="Repeater1_ItemDataBound">
      <ItemTemplate>
                 <tr>     
                      <td>
                            <p class="form-control-static">
             <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                        <ContentTemplate>         
                             <asp:CheckBox ID="CheckBox1" runat="server" AutoPostBack="true" OnCheckedChanged="CheckBox1_CheckedChanged" />
                        </ContentTemplate>
                    </asp:UpdatePanel>
                               
                            </p>
                        </td>    
                        <td>
                            <p class="form-control-static">
                       <asp:UpdatePanel ID="UpdatePanel2" runat="server">
                        <ContentTemplate>   
                                <asp:Literal ID="Literal1" runat="server" Text='<%#Eval("Module") %>'></asp:Literal>         
                               </ContentTemplate>
                    </asp:UpdatePanel>                       
                            </p>
                        </td> 
                        <td>
                             <p class="form-control-static">
                           <%#Eval("Ver") %>
                            </p>
                        </td> 
                     <td>
                             <p class="form-control-static">
                           <%#Eval("Path") %>
                            </p>
                        </td> 
                    </tr>
      </ItemTemplate>
  </asp:Repeater>
                             
           

                </tbody>
              </table>
                    </div>

                  </asp:Panel>
               
                                     </div>
      
         

      </div>

</asp:Content>

