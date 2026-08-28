<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="system_log.aspx.cs" Inherits="admin_user_system_log" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
</asp:Content>

<asp:Content ID="Content3" ContentPlaceHolderID="breadcrumb_holder" runat="Server">
    <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="../index2.aspx"><span class="ezicon ezicon-home"></span></a></li>
        <li class="breadcrumb-item"><%=loginInfo.menuRootName %></li>
        <li class="breadcrumb-item active"><%=loginInfo.menuSubName %></li>
    </ol>
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder" runat="Server">

    <div class="content_box">
        <button class="btn btn-default btn-search" type="button"><i class="fas fa-search"></i>條件搜尋 </button>

        <div class="search_panel panel panel-default">
            <asp:Panel ID="searchPanel" runat="server" CssClass="panel-body form-horizontal" role="form" DefaultButton="searchButton">


                <div class="form-group row">
                    <label class="col-sm-2 control-label">帳號</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="find1" runat="server" placeholder="帳號(可輸入關鍵字查詢)" />
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-2 control-label">登入IP</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="find2" runat="server" placeholder="登入IP (可輸入關鍵字查詢)" />
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-2 control-label">說明</label>
                    <div class="col-sm-10">
                        <input type="text" class="form-control" id="find3" runat="server" placeholder="說明 (可輸入關鍵字查詢)" />
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-2 control-label">事件</label>
                    <div class="col-sm-10">
                        <asp:DropDownList ID="find4" runat="server" CssClass="form-control">
                            <asp:ListItem></asp:ListItem>
                        </asp:DropDownList>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-2 control-label">登入時間</label>
                    <div class="col-sm-10">
                        <input type="text" class="datepicker form-control" id="find5" runat="server" data-date-format="yyyy-mm-dd" placeholder="選擇日期" />
                        ~
                       
                        <input type="text" class="datepicker form-control" id="find6" runat="server" data-date-format="yyyy-mm-dd" placeholder="選擇日期" />
                    </div>
                </div>

                <div class="form-group row">
                    <div class="col-sm-offset-2 col-sm-10">
                        <asp:LinkButton ID="searchButton" runat="server" CssClass="btn btn-default" OnClick="searchButton_Click">
                          <i class="fas fa-search"></i> 搜尋
                        </asp:LinkButton>
                        <a class="btn btn-default" href="system_log.aspx">
                            <i class="fas fa-search"></i>搜尋所有資料
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
                        <th>登入時間</th>
                        <th>帳號</th>
                        <th>IP位址</th>
                        <th>事件</th>
                        <th>說明</th>
                    </tr>
                </thead>
                <tbody>

                    <asp:Repeater ID="Repeater1" runat="server" OnItemDataBound="Repeater1_ItemDataBound">
                        <ItemTemplate>
                            <tr>
                                <td><%#Eval("login_time") %></td>
                                <td><%#Eval("u_id") %></td>
                                <td><%#Eval("login_ip") %></td>
                                <td>
                                    <asp:Label ID="status" runat="server"></asp:Label></td>
                                <td><%#Eval("word") %></td>
                            </tr>
                        </ItemTemplate>
                    </asp:Repeater>


                </tbody>
            </table>

            <asp:Panel ID="noDataPanel" runat="server" Style="text-align: center; color: red; padding-top: 50px; padding-bottom: 50px" Visible="false">
                <asp:Literal ID="msg" runat="server" Text="查無資料"></asp:Literal>
            </asp:Panel>

            <asp:PlaceHolder ID="pagePanel" runat="server">
                <div class="pager_wrapper mt-5">

                    <div class="btn-group d-sm-inline-block d-flex mb-sm-0 mb-3">
                        <asp:HyperLink ID="HyperLink1" runat="server" CssClass="btn btn-default">第一頁</asp:HyperLink>
                        <asp:HyperLink ID="HyperLink2" runat="server" CssClass="btn btn-default">上一頁</asp:HyperLink>
                        <asp:HyperLink ID="HyperLink3" runat="server" CssClass="btn btn-default">下一頁</asp:HyperLink>
                        <asp:HyperLink ID="HyperLink4" runat="server" CssClass="btn btn-default">最終頁</asp:HyperLink>
                    </div>
                    <div class="page_info">
                        <span>頁次：</span>


                        <div class="form-group" style="margin-bottom: 0px">
                            <asp:DropDownList ID="nowpage" runat="server" CssClass="form-select" AutoPostBack="true" Style="width: auto;" OnSelectedIndexChanged="nowpage_SelectedIndexChanged">
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
                    <asp:LinkButton ID="excelButton" runat="server" CssClass="btn btn-default" Visible="false"><span class="glyphicon glyphicon-floppy-save"></span> 匯出Excel</asp:LinkButton>
                    <asp:LinkButton ID="delSelect" runat="server" Visible="false" CssClass="btn btn-default" OnClientClick="return msgconfirm('您確定要刪除已勾選的資料？',this)"><span class="glyphicon glyphicon-trash"></span> 刪除勾選的資料</asp:LinkButton>
                </div>

            </asp:PlaceHolder>

        </div>



    </div>
    <!-- /.content_box -->

</asp:Content>

