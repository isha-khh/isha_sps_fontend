<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="group_show.aspx.cs" Inherits="admin_user_group_show" %>

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
               <button class="btn btn-default btn-search" type="button"> <span class="glyphicon glyphicon-search"></span> 條件搜尋 </button>
          <div class="search_panel panel panel-default">
              <asp:Panel ID="searchPanel" runat="server" CssClass="panel-body form-horizontal" role="form" DefaultButton="searchButton">

              
                  <div class="form-group">
                    <label class="col-sm-2 control-label" >群組代號</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="find1" runat="server" placeholder="群組代號" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="col-sm-2 control-label">群組說明</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="find2" runat="server" placeholder="群組說明 (可輸入關鍵字查詢)" />
                    </div>
                  </div>
                             
                  <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <asp:LinkButton ID="searchButton" runat="server" CssClass="btn btn-default" OnClick="searchButton_Click">
                          <span class="glyphicon glyphicon-search"></span> 搜尋
                        </asp:LinkButton>
                        <a class="btn btn-default" href="group_show.aspx">
                             <span class="glyphicon glyphicon-search"></span> 搜尋所有資料
                        </a>
                        <asp:HiddenField ID="searchQueryStr" runat="server" />
                    </div>
                  </div>
         
                  </asp:Panel>
              
          </div><!-- /.search_panel -->
                   
          <div class="clearfix"></div>

          <div  id="printArea" class="table_wrapper">
              <table class="table table-hover">
                <thead>
                    <tr>
                        <th class="hidden-print"><input type="checkbox" value="" onclick="checkListAll(this.checked)" /></th>
                        <th>群組代號</th>
                        <th>群組說明</th>                
                        <th class="hidden-print">修改</th>
                        <th class="hidden-print">刪除</th>
                    </tr>
                </thead>
                <tbody>

  <asp:Repeater ID="Repeater1" runat="server">
      <ItemTemplate>
                 <tr>
                        <td class="hidden-print">
                            <asp:CheckBox ID="CheckBox1" runat="server" CssClass="listCheck" />
                            <asp:HiddenField ID="num" runat="server" Value='<%#Eval("num") %>' /> 
                        </td>
                        <td><%#Eval("g_name") %></td>
                        <td><%#Eval("demo") %></td>                 
                        <td class="hidden-print">                         
                             <a href="group_reg.aspx?num=<%#Eval("num")  + "&page=" + nowpage.SelectedValue + ValString(ViewState["query"])%>" class="btn btn-default btn-sm">
                              <span class="glyphicon glyphicon-pencil"></span>
                            </a>
                        </td>
                        <td class="hidden-print">
                            <asp:LinkButton ID="del" runat="server" CssClass="btn btn-default btn-sm" OnClientClick="return msgconfirm('您確定要刪除？',this)" OnClick="del_Click">
                                 <span class="glyphicon glyphicon-trash"></span>
                            </asp:LinkButton>      
                        </td>
                    </tr>
      </ItemTemplate>
  </asp:Repeater>
                                       
                   
                </tbody>
              </table>

              <asp:Panel ID="noDataPanel" runat="server" style="text-align:center; color:red; padding-top:50px; padding-bottom:50px" Visible="false">
                  <asp:Literal ID="msg" runat="server" Text="查無資料"></asp:Literal></asp:Panel>
            

               <asp:PlaceHolder ID="pagePanel" runat="server">
          <div class="pager_wrapper">

            <div class="btn-group">
              <asp:HyperLink ID="HyperLink1" runat="server" CssClass="btn btn-default">第一頁</asp:HyperLink>
                <asp:HyperLink ID="HyperLink2" runat="server" CssClass="btn btn-default">上一頁</asp:HyperLink>
                <asp:HyperLink ID="HyperLink3" runat="server" CssClass="btn btn-default">下一頁</asp:HyperLink>
                <asp:HyperLink ID="HyperLink4" runat="server" CssClass="btn btn-default">最終頁</asp:HyperLink>
            </div>
            <div class="page_info">
                <span>頁次：</span>


                <div class="form-group" style="margin-bottom:0px">
                     <asp:DropDownList ID="nowpage" runat="server" CssClass="form-control" AutoPostBack="true" style="width:auto;" OnSelectedIndexChanged="nowpage_SelectedIndexChanged">
                      </asp:DropDownList>
                </div>

                <asp:HiddenField ID="maxpage" runat="server" />
                <span>資料總數： <asp:Literal ID="total" runat="server"></asp:Literal></span>
            </div>

              </div>

          <hr />
          <div class="btn_wrapper">
              <button type="button" class="btn btn-default btn-print" onclick="PrintTagData('printArea')"><span class="glyphicon glyphicon-print"></span> 列印本頁</button>
              <asp:LinkButton ID="excelButton" runat="server" CssClass="btn btn-default" Visible="false"><span class="glyphicon glyphicon-floppy-save"></span> 匯出Excel</asp:LinkButton>
               <asp:LinkButton ID="delSelect" runat="server" CssClass="btn btn-default" OnClientClick="return msgconfirm('您確定要刪除已勾選的資料？',this)" OnClick="delSelect_Click"><span class="glyphicon glyphicon-trash"></span> 刪除勾選的資料</asp:LinkButton>
          </div>

              </asp:PlaceHolder>

          </div>

         

      </div><!-- /.content_box -->

</asp:Content>

