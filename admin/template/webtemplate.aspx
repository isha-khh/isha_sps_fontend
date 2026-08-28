<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="webtemplate.aspx.cs" Inherits="admin_webtemplate" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" Runat="Server">
    
    
    <link href="../../App_Script/lightbox/css/lightbox.css" rel="stylesheet" />
    <script src="../../App_Script/lightbox/js/lightbox.min.js"></script>
    

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
        
              <div class="panel-heading">前台樣版資料設定</div>

                <div class="panel-body form-horizontal" role="form">
        
                
                   <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">樣版主題</label>
                    <div class="col-sm-10">
                       <p class="form-control-static">
                        <asp:DropDownList ID="TemplateMaster" runat="server" AutoPostBack="true" CssClass="form-control"  style="width:auto" OnSelectedIndexChanged="TemplateMaster_SelectedIndexChanged">
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
                        <%#br(ValString(Eval("description"))) %>
                             </p>
                    </div>
                               
            </asp:Panel>

</asp:PlaceHolder>
                       

                        </ItemTemplate>
                    </asp:Repeater>

                    <asp:PlaceHolder ID="PlaceHolder2" runat="server">

          <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">自訂首頁背景</label>
                    <div class="col-sm-9  col-md-10">
                          <p class="form-control-static">
                        <asp:FileUpload ID="FileUpload1" runat="server" style="display:inline" />

                                <asp:DropDownList ID="repeat1" runat="server" CssClass="form-control"  style="width:auto;display:inline">
                                  <asp:ListItem Value="no-repeat" Text="不重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat" Text="重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat-x" Text="水平重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat-y" Text="垂直重複"></asp:ListItem>
                              </asp:DropDownList>    
                                </p>

                         <p class="form-control-static">
                      
                        <asp:HiddenField ID="pic1" runat="server" />                                  
                       <asp:HyperLink ID="HyperLink1" runat="server" data-lightbox="roadtrip" Visible="false"><asp:Image ID="Image1" runat="server"  style="margin:5px; width:100px" /></asp:HyperLink>
                  <asp:CheckBox ID="delpic1" runat="server" Visible="false" Text="刪除圖片" />
                             </p>
                       </div>
                 </div>

                            <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">自訂內頁背景</label>
                    <div class="col-sm-9  col-md-10">
                          <p class="form-control-static">
                        <asp:FileUpload ID="FileUpload2" runat="server"  style="display:inline"  />

                                <asp:DropDownList ID="repeat2" runat="server" CssClass="form-control" style="width:auto;display:inline">
                                  <asp:ListItem Value="no-repeat" Text="不重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat" Text="重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat-x" Text="水平重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat-y" Text="垂直重複"></asp:ListItem>
                              </asp:DropDownList>    
                                    </p>

                         <p class="form-control-static">
                    
                        <asp:HiddenField ID="pic2" runat="server"  />    
                                  
                       <asp:HyperLink ID="HyperLink2" runat="server" data-lightbox="roadtrip" Visible="false"><asp:Image ID="Image2" runat="server"  style="margin:5px; width:100px" /></asp:HyperLink>
                             <asp:CheckBox ID="delpic2" runat="server" Visible="false" Text="刪除圖片" />
                              </p>
                       </div>
                 </div>

            <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">自訂首頁標題區塊背景</label>
                    <div class="col-sm-9  col-md-10">
                          <p class="form-control-static">
                        <asp:FileUpload ID="FileUpload3" runat="server"  style="display:inline"  />

                                 <asp:DropDownList ID="repeat3" runat="server" CssClass="form-control"  style="width:auto;display:inline">
                                  <asp:ListItem Value="no-repeat" Text="不重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat" Text="重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat-x" Text="水平重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat-y" Text="垂直重複"></asp:ListItem>
                              </asp:DropDownList>   
      </p>

                         <p class="form-control-static">

                 
                        <asp:HiddenField ID="pic3" runat="server"  />    
                         
                       <asp:HyperLink ID="HyperLink3" runat="server" data-lightbox="roadtrip" Visible="false"><asp:Image ID="Image3" runat="server"  style="margin:5px; width:100px" /></asp:HyperLink>
                            <asp:CheckBox ID="delpic3" runat="server" Visible="false" Text="刪除圖片" />
                            </p>
                       </div>
                 </div>

                                    <div class="form-group">
                    <label  class="col-sm-3 col-md-2 control-label">自訂內頁標題區塊背景</label>
                    <div class="col-sm-9  col-md-10">
                          <p class="form-control-static">
                        <asp:FileUpload ID="FileUpload4" runat="server"  style="display:inline"  />

                                <asp:DropDownList ID="repeat4" runat="server" CssClass="form-control" style="width:auto;display:inline">
                                  <asp:ListItem Value="no-repeat" Text="不重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat" Text="重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat-x" Text="水平重複"></asp:ListItem>
                                  <asp:ListItem Value="repeat-y" Text="垂直重複"></asp:ListItem>
                              </asp:DropDownList> 
          </p>
                     
                        <asp:HiddenField ID="pic4" runat="server"  />       
                        

                         <p class="form-control-static">             
                       <asp:HyperLink ID="HyperLink4" runat="server" data-lightbox="roadtrip" Visible="false"><asp:Image ID="Image4" runat="server"  style="margin:5px; width:100px" /></asp:HyperLink>
                       <asp:CheckBox ID="delpic4" runat="server" Visible="false" Text="刪除圖片" />
                              </p>
                       </div>
                 </div>


                        </asp:PlaceHolder>


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

