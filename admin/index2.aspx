<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="index2.aspx.cs" Inherits="admin_index2" %>

<%@ Register Src="~/admin/uc/WRP_Widgets.ascx" TagPrefix="uc1" TagName="WRP_Widgets" %>


<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">
    <style type="text/css">
        .notice a, span {
            width: auto !important;
        }
    </style>

</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="breadcrumb_holder" runat="Server">
    <ol class="breadcrumb">
        <li><span class="ezicon ezicon-home"></span></li>
    </ol>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder" runat="Server">

    <div class="content_box">
        <div class="dashboard row">
            <div class="dashboard_box b01 col-md-4 col-sm-6 col-xs-12">
                <div class="box_bg">
                    <div class="ezicon ezicon-gear"></div>
                    <h1>系統資訊</h1>
                    <div class="dashboard_content">
                        <h5 class=""><small>等級</small><asp:Literal ID="ezwebVersion" runat="server"></asp:Literal></h5>
                        <h4>已選購項目:</h4>
                        <ul class="dashboard_list">
                            <asp:Repeater ID="ModuleRepeater" runat="server">
                                <ItemTemplate>
                                    <li><span class="glyphicon glyphicon-ok"></span><%#ValString(Eval("module")).Replace("模組","系統") %></li>
                                </ItemTemplate>
                            </asp:Repeater>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="dashboard_box b02 col-md-4 col-sm-6 col-xs-12">
                <div class="box_bg">
                    <div class="ezicon ezicon-user"></div>
                    <h1>帳戶資訊</h1>
                    <div class="dashboard_content">
                        <h5>
                            <span class="ezicon-key"></span><small>帳號</small><span class="acc_mane"><asp:Literal ID="u_id" runat="server"></asp:Literal></span>
                            <asp:HyperLink ID="logout" runat="server" NavigateUrl="~/admin/index.aspx"><span class="ezicon ezicon-logout"></span> 登出</asp:HyperLink>
                        </h5>

                        <h4>登入時間：</h4>
                        <p>
                            <asp:Literal ID="LoginTime" runat="server"></asp:Literal></p>
                        <h4>上次登入：</h4>
                        <p>
                            <asp:Literal ID="LoginLastTime" runat="server"></asp:Literal></p>

                    </div>
                </div>
            </div>
            <div class="dashboard_box b03 col-md-4 col-sm-6 col-xs-12">
                <div class="box_bg">
                    <div class="ezicon ezicon-link"></div>
                    <h1>管理工具</h1>
                    <div class="dashboard_content">
                        <a href="https://www.wrp.com.tw" target="_blank"><span class="glyphicon glyphicon-tag"></span>WRP 網站資源整合語系</a>
                        <a href="https://www.google.com/intl/zh-TW/analytics/" target="_blank"><span class="glyphicon glyphicon-tag"></span>Google Analytics</a>
                    </div>
                </div>
            </div>
        </div>
        <!-- /dashboard -->
        <div class="row admin_widgets">
            <asp:Panel ID="wrpPanel" runat="server" Visible="false">
                <uc1:WRP_Widgets runat="server" ID="WRP_Widgets" />
            </asp:Panel>
            <%-- 2017/10/30 改用ajax抓取，搬至 WRP_Widgets.ascx
            <div class="col-md-12" id="wrpDiv" runat="server">
                <asp:Panel ID="wrpPanel" runat="server" CssClass="panel panel-default form-horizontal information" role="form">
                    <asp:HiddenField ID="wrpApiUrl" runat="server" />
                    <div class="panel-heading">
                        <strong>WRP公告</strong><asp:CheckBox ID="wrpEnable" runat="server" Visible="false" AutoPostBack="true" OnCheckedChanged="wrpEnable_CheckedChanged" />
                    </div>
                    <div class="panel-body">
                        <div class="wrpNews_lsit">
                            <ul id="wrpUl" runat="server" visible="false" class="list-unstyled news_list">
                                <asp:Repeater ID="wrpRepeater" runat="server">
                                    <ItemTemplate>
                                        <li><a href="<%#Eval("url") %>" target="_blank"><%#Eval("subject") %></a><span><%#Eval("uptime") %></span></li>
                                    </ItemTemplate>
                                </asp:Repeater>
                            </ul>
                        </div>
                        <div>
                            <asp:HyperLink ID="wrpMore" CssClass="btn btn-normal pull-right" runat="server" Visible="false" Target="_blank">觀看更多</asp:HyperLink>
                        </div>
                    </div>
                </asp:Panel>
            </div>--%>

            <asp:PlaceHolder ID="HomeAreaHolder" runat="server"></asp:PlaceHolder>

        </div>
    </div>

    <!-- /.content_box -->
</asp:Content>

