<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="menu_range.aspx.cs" Inherits="admin_template_menu_range" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" Runat="Server">

         <!--拖拽排序-->        
    <link type="text/css"  href="../../App_Script/sort/sort.css" rel="stylesheet" />
    <script type="text/javascript"  src="../../App_Script/sort/jquery-sortable.js"></script>
    <script type="text/javascript"  src="../../App_Script/sort/jquery.ui.core.js"></script> 
<script type="text/javascript">

    $(function () {

        var group = $("ol.example").sortable({

            group: 'limited_drop_targets',
            isValidTarget: function (item, container) {
                if (item.is(".highlight"))
                    return true
                else {
                    return item.parent("ol")[0] == container.el[0]
                }
            },
            onDrop: function (item, container, _super) {
                $('#<%=sortNum.ClientID%>').val(group.sortable("serialize").get().join("\n"))
                _super(item, container)
            },
            serialize: function (parent, children, isContainer) {
                return isContainer ? children.join() : parent.attr('num')
            },
            tolerance: 6,
            distance: 10
        });

        $("ol.example").disableSelection();
        $('#<%=sortNum.ClientID%>').val(group.sortable("serialize").get().join("\n"));

    })

</script>
<!--拖拽排序-->

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
                       <asp:Panel ID="nationPanel" runat="server" CssClass="panel-heading"> 
                          <asp:DropDownList ID="nation" runat="server" CssClass="form-control" AutoPostBack="true" OnSelectedIndexChanged="nation_SelectedIndexChanged"></asp:DropDownList>
                          </asp:Panel>
                    <div class="panel-heading">
                            <a href="<%=Request.Url.AbsolutePath + "?nation=" + nation.SelectedValue %>" class="btn btn-default">顯示主選項</a>
                               </div>
                      <div class="panel-heading">選擇項目</div>
                      <div class="panel-body">
                        <ul class="list-unstyled">

                            <asp:TreeView ID="TreeView1" runat="server"></asp:TreeView>

                        </ul>

                            

                      </div>
                  </div>

                </div>

<asp:Panel ID="formPanel"  runat="server" CssClass="col-sm-8">

    <asp:HiddenField ID="HiddenField1" runat="server" />

          <div class="panel panel-default">            
                <div class="panel-heading">請直接拖曳調整以下排序的順序後按 <asp:Button ID="submitButton" runat="server" Text="儲存" CssClass="btn btn-default" OnClick="submitButton_Click"  /></div>

              <asp:Panel ID="Panel1" runat="server" CssClass="panel-body form-horizontal" role="form"  DefaultButton="submitButton">          
                      
                  <div class="form-group">
              
<ol class="example">
    <asp:Repeater ID="Repeater1" runat="server">
        <ItemTemplate>
            <li num="<%#Eval("num") %>"><%#Eval("kind") %></li>
        </ItemTemplate>
    </asp:Repeater>        
      
</ol>
                                            <asp:HiddenField ID="sortNum" runat="server"  />

                 </div>
                
                  <div class="panel-heading">
                      <asp:Button ID="submitButton2" runat="server" Text="儲存" CssClass="btn btn-default" OnClick="submitButton_Click"  />
                        <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                  </div>

              
              </asp:Panel>
          </div>


</asp:Panel>
            

            </div>
      </div><!-- /.content_box -->

</asp:Content>

