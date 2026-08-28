<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="pass.aspx.cs" Inherits="admin_user_pass" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
</asp:Content>

<asp:Content ID="Content3" ContentPlaceHolderID="breadcrumb_holder" runat="Server">
    <ol class="breadcrumb">
        <li><a href="../index2.aspx"><span class="ezicon ezicon-home"></span></a></li>
        <li><%=loginInfo.menuRootName %></li>
        <li class="active"><%=loginInfo.menuSubName %></li>
    </ol>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder" runat="Server">

    <div class="content_box">
        <button class="btn btn-default btn-search" type="button"><span class="glyphicon glyphicon-search"></span>條件搜尋 </button>

        <div class="search_panel panel panel-default">
            <asp:Panel ID="searchPanel" runat="server" CssClass="panel-body form-horizontal" role="form" DefaultButton="searchButton">


                <div class="form-group">
                    <label class="col-sm-2 control-label">帳號</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="find1" runat="server" placeholder="帳號(可輸入關鍵字查詢)" />
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-2 control-label">使用者名稱</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="find2" runat="server" placeholder="群組說明 (可輸入關鍵字查詢)" />
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-2 control-label">群組</label>
                    <div class="col-sm-10">
                        <asp:DropDownList ID="find3" runat="server" CssClass="form-control">
                            <asp:ListItem></asp:ListItem>
                        </asp:DropDownList>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-2 control-label">狀態</label>
                    <div class="col-sm-10">
                        <asp:DropDownList ID="find4" runat="server" CssClass="form-control">
                            <asp:ListItem></asp:ListItem>
                            <asp:ListItem Value="1" Text="啟用"></asp:ListItem>
                            <asp:ListItem Value="0" Text="停用"></asp:ListItem>
                        </asp:DropDownList>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-2 control-label">登入時間</label>
                    <div class="col-sm-10">
                        <input type="text" class="datepicker form-control" id="find5" runat="server" data-date-format="yyyy-mm-dd" placeholder="選擇日期" />
                        ~
                        <input type="text" class="datepicker form-control" id="find6" runat="server" data-date-format="yyyy-mm-dd" placeholder="選擇日期" />
                    </div>
                </div>

                <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <asp:LinkButton ID="searchButton" runat="server" CssClass="btn btn-default" OnClick="searchButton_Click">
                          <span class="glyphicon glyphicon-search"></span> 搜尋
                        </asp:LinkButton>
                        <a class="btn btn-default" href="index.aspx">
                            <span class="glyphicon glyphicon-search"></span>搜尋所有資料
                        </a>
                        <asp:HiddenField ID="searchQueryStr" runat="server" />
                    </div>
                </div>

            </asp:Panel>

        </div>
        <!-- /.search_panel -->

        <div class="clearfix"></div>

        <div id="printArea" class="table_wrapper">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th class="hidden-print">
                            <input type="checkbox" value="" onclick="checkListAll(this.checked)" /></th>
                        <th>帳號</th>
                        <th>使用者名稱</th>
                        <th>密碼</th>
                        <th>狀態</th>
                    </tr>
                </thead>
                <tbody>

                    <asp:Repeater ID="Repeater1" runat="server" OnItemDataBound="Repeater1_ItemDataBound">
                        <ItemTemplate>
                            <tr>
                                <td class="hidden-print">
                                    <asp:CheckBox ID="CheckBox1" runat="server" CssClass="listCheck" />
                                    <asp:HiddenField ID="num" runat="server" Value='<%#Eval("num") %>' />
                                </td>
                                <td><%#Eval("u_id") %></td>
                                <td><%#Eval("u_name") %></td>
                                <td><%# (!isStrNull(Eval("u_password")) ? encrypt.DecryptAutoKey(ValString(Eval("u_password"))) : "") %></td>
                                <td><%# (Convert.ToBoolean(Eval("online"))?"<span style=\"color:green\">啟用</span>":"<span style=\"color:red\">停用</span>" )%></td>
                            </tr>
                        </ItemTemplate>
                    </asp:Repeater>


                </tbody>
            </table>

            <asp:Panel ID="noDataPanel" runat="server" Style="text-align: center; color: red; padding-top: 50px; padding-bottom: 50px" Visible="false">
                <asp:Literal ID="msg" runat="server" Text="查無資料"></asp:Literal>
            </asp:Panel>

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


                        <div class="form-group" style="margin-bottom: 0px">
                            <asp:DropDownList ID="nowpage" runat="server" CssClass="form-control" AutoPostBack="true" Style="width: auto;" OnSelectedIndexChanged="nowpage_SelectedIndexChanged">
                            </asp:DropDownList>
                        </div>

                        <asp:HiddenField ID="maxpage" runat="server" />
                        <span>資料總數：
                            <asp:Literal ID="total" runat="server"></asp:Literal></span>
                    </div>

                </div>

                <hr />
                <div class="btn_wrapper">
                    <button type="button" class="btn btn-default btn-print" onclick="PrintTagData('printArea')"><span class="glyphicon glyphicon-print"></span>列印本頁</button>
                </div>

            </asp:PlaceHolder>

        </div>



    </div>
    <!-- /.content_box -->

</asp:Content>

