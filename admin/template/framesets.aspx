<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="framesets.aspx.cs" Inherits="admin_template_framesets" %>

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
        #deployDorpDiv div{
            float:left;      
            padding-right:5px;              
        }
        .DeployPanel {
            height:200px;
            width:100%;
            overflow:auto;
        }

    </style>
    <script type="text/javascript">
        $(window).ready(function () {               

            if ($('#<%=template_wrp.ClientID%>').val() != "") {
                swithWrpTemplate($('#<%=template_wrp.ClientID%>').val());
            }       
        });

        function swithWrpTemplate(id) {
            $('.ItemTemplate').slideUp();
            $('#template_wrp_' + id).slideDown();
        }

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
            <asp:Panel ID="Panel2" runat="server" CssClass="panel panel-default" DefaultButton="submitButton">
        
              <div class="panel-heading">樣版資料設定</div>

                <div class="panel-body form-horizontal" role="form">
        
                
                   <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">節慶主題</label>
                    <div class="col-sm-10">
                       
                            <asp:DropDownList ID="template_wrp" runat="server" CssClass="form-control" style="width:auto"  AutoPostBack="true" OnSelectedIndexChanged="template_wrp_SelectedIndexChanged">
                                <asp:ListItem Value="" Text="無"></asp:ListItem>
                            </asp:DropDownList>

                       
                        <asp:Repeater ID="Repeater1" runat="server">
                            <ItemTemplate>                             
                                <div id="template_wrp_<%#Eval("ID") %>" class="ItemTemplate">
                                    <div style="float:left"><img src="<%#ResolveUrl("~/" + Eval("ThumbImg")) %>" /></div>
                                    <div><%#br(Eval("Description").ToString()) %></div>
                                    <asp:HiddenField ID="ID" runat="server" Value='<%#Eval("ID") %>' />
                                    <asp:HiddenField ID="CssFile" runat="server" Value='<%#Eval("CssFile") %>' />
                                    <div class="SeparatorTemplate"></div>
                                </div>
                            </ItemTemplate>                            
                        </asp:Repeater>
                        
                    </div>
                 </div>

                     <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">主題位置</label>
                    <div class="col-sm-10">

                       <p class="form-control-static">
                           主角垂直位置：
                                   <input type="text" class="form-control" id="frame_top" runat="server" placeholder="垂直位置" maxlength="5" style="width:120px; display:inline" />
                           <asp:RegularExpressionValidator ControlToValidate="frame_top" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required"  ID="RegularExpressionValidator3" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" /> 
                      <span style="color:blue">(註：以網頁的頂瑞為主題的正上方，往上請輸入小於0的數字，往下請輸入大於0的數字)</span>
                           </p>
                       <p class="form-control-static">
                          主角水平位置：
                                     <input type="text" class="form-control" id="frame_left" runat="server" placeholder="垂直位置" maxlength="5" style="width:120px; display:inline" />
                           <asp:RegularExpressionValidator ControlToValidate="frame_left" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required"  ID="RegularExpressionValidator1" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" /> 
                     <span style="color:blue">(註：以網頁的中心為主題的左上角，往左請輸入小於0的數字， 往右請輸入大於0的數字)</span>
                           </p>
                           <p class="form-control-static">
                               主角堆疊位置：
                               <asp:DropDownList ID="frame_zindex" runat="server" CssClass="form-control" style="width:auto; display:inline">
                                    <asp:ListItem Value="" Text="預設"></asp:ListItem>
                                   <asp:ListItem Value="front" Text="置前"></asp:ListItem>
                                   <asp:ListItem Value="back" Text="置後"></asp:ListItem>
                               </asp:DropDownList>    
                           </p>
                         <p class="form-control-static">
                               主角狀態：
                               <asp:DropDownList ID="frame_display" runat="server" CssClass="form-control" style="width:auto; display:inline">                            
                                   <asp:ListItem Value="block" Text="顯示"></asp:ListItem>
                                   <asp:ListItem Value="none" Text="關閉"></asp:ListItem>
                               </asp:DropDownList>    
                           </p>
                    </div>
                 </div>

           
                        <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">   

                          <asp:Button ID="submitButton" runat="server" Text="送出" CssClass="btn btn-default"  OnClick="submitButton_Click"  ValidationGroup="Required"  />                 
                        <asp:Label ID="msg2" runat="server" ForeColor="Red"></asp:Label>
                     
                    </div>
                 </div>

        </div>

                    

           </asp:Panel>

       
          

      </div><!-- /.content_box -->

</asp:Content>

