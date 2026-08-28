<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="widgets.aspx.cs" Inherits="admin_template_widgets" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" Runat="Server">
    

    <style type="text/css">
         .ItemTemplate{
             display:none;
         }
         .ItemTemplate div{
            padding:5px;
        }
          .ItemTemplate img{
            width:320px;
        }
        .SeparatorTemplate{
            clear:both;
            width:100%;
        }
        .WidgetsDorpDiv div{
            float:left;      
            padding-right:5px;              
        }
        .WidgetsPanel {
            height:200px;
            width:100%;
            overflow:auto;
        }

    </style>
 
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

           <asp:UpdatePanel ID="UpdatePanel1" runat="server">
              <ContentTemplate>

                  <asp:Panel ID="Panel3" runat="server" CssClass="panel panel-default">
               <div class="panel-heading">版面配置設定</div>
               <div class="panel-body form-horizontal" role="form">

         <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">選擇單元</label>
                    <div class="col-sm-10">
                        <div class="WidgetsDorpDiv">
                            <div>
                        <asp:DropDownList ID="Category" runat="server" CssClass="form-control" AutoPostBack="true" OnSelectedIndexChanged="Category_SelectedIndexChanged">
                                <asp:ListItem Value="" Text="請選擇單元"></asp:ListItem>
                                <asp:ListItem Value="*" Text="全部 (設定後將會覆蓋其它單元)"></asp:ListItem>
                            </asp:DropDownList>
                            </div>
                               </div>
                            
                        
                    </div>
                 </div>

 <asp:PlaceHolder ID="PlaceHolder1" runat="server" Visible ="false">

                                     <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">新增配置</label>
                    <div class="col-sm-10">
                      
                        <div class="WidgetsDorpDiv">
                             <div>
                            <asp:DropDownList ID="UserControl" runat="server" CssClass="form-control">
                                <asp:ListItem Value="" Text="請選擇選單"></asp:ListItem>
                            </asp:DropDownList>
                                           <asp:RequiredFieldValidator ID="RequiredFieldValidator1" runat="server" ControlToValidate="UserControl" ValidationGroup="WidgetsAdd" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>                       
        
                                </div>
                              <div>
                                  <asp:RadioButtonList ID="WidgetsSet" runat="server" RepeatDirection="Horizontal" RepeatLayout="Flow">
                                      <asp:ListItem Value="Left" Text="&nbsp;左側&nbsp;&nbsp;" Selected="True"></asp:ListItem>
                                        <asp:ListItem Value="Right" Text="&nbsp;右側"></asp:ListItem>
                                  </asp:RadioButtonList>                       
                                     <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="WidgetsSet" ValidationGroup="WidgetsAdd" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>                       
        
                                </div>                         
                            <div>
                                <asp:LinkButton ID="WidgetsAdd" runat="server" CssClass="btn btn-default" ValidationGroup="WidgetsAdd" OnClick="widgetsAdd_Click">加入</asp:LinkButton>
                             </div>
                        </div>
                            
                        
                    </div>
                 </div>

                   <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">配置清單</label>
                    <div class="col-sm-10">
                      
                        <div class="panel panel-default" style="width:45%; float:left; margin-right:10px">
                            <div class="panel-heading">左側配置</div>
                             <div class="panel-body form-horizontal" role="form">
                                 <div class="WidgetsPanel">
                                     <asp:Repeater ID="WidgetsRepeaterLeft" runat="server" OnItemDataBound="WidgetsRepeater_ItemDataBound">
                                         <ItemTemplate>
                                             <div style="clear:both;">                                              
                                                 <div style="float:left">
                                                    <%#Eval("Title") %>
                                                  <asp:HiddenField ID="Name" runat="server" Value='<%#Eval("Name") %>' />
                                                 <asp:HiddenField ID="Range" runat="server" Value='<%#Eval("Range") %>' />
                                                 </div>
                                                <div style="float:right">
                                                    <asp:LinkButton ID="upMovie" runat="server" CssClass="btn btn-default" OnClick="widgetsMovie_Click">上</asp:LinkButton>
                                                    <asp:LinkButton ID="downMovie" runat="server" CssClass="btn btn-default" OnClick="widgetsMovie_Click">下</asp:LinkButton>
                                                    <asp:LinkButton ID="rightMovie" runat="server" CssClass="btn btn-default" OnClick="widgetsMovie_Click">右</asp:LinkButton>
                                                    <asp:LinkButton ID="delete" runat="server" CssClass="btn btn-default" OnClick="delete_Click">移除</asp:LinkButton>
                                                </div>                                                 
                                             </div>
                                         </ItemTemplate>
                                     </asp:Repeater>
                                     <asp:HiddenField ID="WidgetsLeftValue" runat="server" />
                                 </div>
                              </div>                          
                        </div>
                 
                        <div class="panel panel-default" style="width:45%; float:left">
                            <div class="panel-heading">右側配置</div>
                             <div class="panel-body form-horizontal" role="form">
                                 <div class="WidgetsPanel">
                                       <asp:Repeater ID="WidgetsRepeaterRight" runat="server" OnItemDataBound="WidgetsRepeater_ItemDataBound">
                                         <ItemTemplate>
                                             <div style="clear:both">                                              
                                                 <div style="float:left">
                                                    <%#Eval("Title") %>
                                                  <asp:HiddenField ID="Name" runat="server" Value='<%#Eval("Name") %>' />
                                                 <asp:HiddenField ID="Range" runat="server" Value='<%#Eval("Range") %>' />
                                                 </div>
                                                <div style="float:right">
                                                    <asp:LinkButton ID="upMovie" runat="server" CssClass="btn btn-default" OnClick="widgetsMovie_Click">上</asp:LinkButton>
                                                    <asp:LinkButton ID="downMovie" runat="server" CssClass="btn btn-default" OnClick="widgetsMovie_Click">下</asp:LinkButton>
                                                    <asp:LinkButton ID="leftMovie" runat="server" CssClass="btn btn-default" OnClick="widgetsMovie_Click">左</asp:LinkButton>
                                                    <asp:LinkButton ID="delete" runat="server" CssClass="btn btn-default" OnClick="delete_Click">移除</asp:LinkButton>
                                                </div>                                                 
                                             </div>
                                         </ItemTemplate>
                                     </asp:Repeater>
                                      <asp:HiddenField ID="WidgetsRightValue" runat="server" />
                                 </div>
                              </div>                          
                        </div>
                       
                    </div>
                 </div>

                                  <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">                        
                        <asp:Label ID="msg3" runat="server" ForeColor="Red"></asp:Label>
                    </div>
                 </div>
                      
 </asp:PlaceHolder>                
         

                 </div>
            </asp:Panel>
             
      
              </ContentTemplate>
          </asp:UpdatePanel>  

           
          

      </div><!-- /.content_box -->

</asp:Content>

