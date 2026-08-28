<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="admintemplate.aspx.cs" Inherits="admin_admintemplate" %>

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
            <asp:Panel ID="Panel2" runat="server" CssClass="panel panel-default" DefaultButton="submitButton">
        
              <div class="panel-heading">後台樣版資料設定</div>

                <div class="panel-body form-horizontal" role="form">
        
                
                   <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">樣版主題</label>
                    <div class="col-sm-10">
                       <p class="form-control-static">
                        <asp:DropDownList ID="TemplateMaster" runat="server" AutoPostBack="true" OnSelectedIndexChanged="TemplateMaster_SelectedIndexChanged">
                        </asp:DropDownList>
                            </p>

                    </div>
                 </div>

                    <asp:Repeater ID="Repeater1" runat="server">
                        <ItemTemplate>

<asp:PlaceHolder ID="PlaceHolder1" runat="server">

             <div class="form-group" <%#(isStrNull(Eval("img"))?"style=\"display:none\"":"") %>>  
                      <label for="user_id" class="col-sm-2 control-label">樣版圖示</label>
                    <div class="col-sm-10">
                         <p class="form-control-static">
                              <img src="<%# ResolveUrl(ValString(Eval("img")))%>" width="300" />
                         </p>
                    </div>
              </div>                   
   

             <asp:Panel ID="Panel1" runat="server" CssClass="form-group">  
                 
                      <label for="user_id" class="col-sm-2 control-label">樣版說明</label>
                    <div class="col-sm-10">
                         <p class="form-control-static">
                        <%#ValString(Eval("description")) %>
                             </p>
                    </div>
                               
            </asp:Panel>

</asp:PlaceHolder>
                       

                        </ItemTemplate>
                    </asp:Repeater>

                        <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">   

                          <asp:Button ID="submitButton" runat="server" Text="送出" CssClass="btn btn-default"  OnClick="submitButton_Click"   />                 
                        <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                     
                    </div>
                 </div>

           
                
        </div>

                    

           </asp:Panel>

       
          

      </div><!-- /.content_box -->

</asp:Content>

