<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="pageset.aspx.cs" ValidateRequest="false" Inherits="admin_template_pageset" %>

<%@ Register Src="~/admin/uc/seo.ascx" TagPrefix="uc1" TagName="seo" %>

<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="Server">

    <!--編緝器-->
    <script type="text/javascript" src="<%=ResolveUrl("~/admin/ckeditor/ckeditor.js") %>"></script>
    <script type="text/javascript">
        CKEDITOR.config.toolbar = 'Default';
    </script>
    <!--編緝器-->

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
        <asp:Panel ID="Panel1" runat="server" CssClass="panel panel-default" DefaultButton="editButton">

            <div class="panel-heading">頁面資料設定</div>

            <div class="panel-body form-horizontal" role="form">

                <asp:Panel ID="nationPanel" runat="server" CssClass="form-group">
                    <label class="col-sm-3 col-md-2 control-label">* 語系</label>
                    <div class="col-sm-9  col-md-10">
                        <asp:DropDownList ID="nation" runat="server" CssClass="form-control" AutoPostBack="true" OnSelectedIndexChanged="nation_SelectedIndexChanged"></asp:DropDownList>
                    </div>
                </asp:Panel>

                <uc1:seo runat="server" ID="uc_seo" />

                <div class="form-group">
                    <label for="user_id" class="col-sm-2 control-label">聯絡資訊</label>
                    <div class="col-sm-10">
                        <p class="form-control-static">
                            網站名稱：<input type="text" class="form-control" id="Com_name" runat="server" placeholder="網站名稱" maxlength="50" />
                        </p>
                        <p class="form-control-static">
                            營業電話：<input type="text" class="form-control" id="Com_tel" runat="server" placeholder="營業電話" maxlength="25" />
                        </p>
                        <p class="form-control-static">
                            傳真電話：<input type="text" class="form-control" id="Com_fax" runat="server" placeholder="傳真電話" maxlength="25" />
                        </p>
                        <p class="form-control-static">
                            公司信箱：<input type="text" class="form-control" id="Com_mail" runat="server" placeholder="公司信箱" maxlength="100" />
                        </p>
                        <p class="form-control-static">
                            營業地址：<input type="text" class="form-control" id="Com_address" runat="server" placeholder="營業地址" maxlength="100" />
                        </p>
                        <p class="form-control-static">
                            Google Map： 
                              <asp:TextBox ID="Com_gmap" runat="server" CssClass="form-control" TextMode="MultiLine" Rows="3" placeholder="Google Map 嵌入碼"></asp:TextBox>
                        </p>
                        <p class="form-control-static">
                            營業時間：
                            <input type="text" class="form-control" id="Com_bstime" runat="server" placeholder="營業時間" maxlength="50" />
                        </p>
                       <p class="form-control-static">
                           <asp:Panel ID="CommunityPanel" runat="server">
                            Facebook粉絲團 <input type="text" class="form-control"  id="Com_Community_Facebook" runat="server" placeholder="Facebook粉絲團" maxlength="200" />
                            Instagram粉絲團 <input type="text" class="form-control" id="Com_Community_Ig" runat="server" placeholder="Instagram粉絲團" maxlength="200" />
                             Youtube粉絲團 <input type="text" class="form-control" id="Com_Community_Youtobe" runat="server" placeholder="Youtube粉絲團" maxlength="200" />
                           Twitter粉絲團 <input type="text" class="form-control" id="Com_Community_Twitter" runat="server" placeholder="Twitter粉絲團" maxlength="200" />
                            Pinterest粉絲團 <input type="text" class="form-control" id="Com_Community_Pinterest" runat="server" placeholder="Pinterest粉絲團" maxlength="200" />
                               Line 好友<input type="text" class="form-control" id="Com_Community_Line" runat="server" placeholder="Line好友" maxlength="200" />
                             </asp:Panel>
                        </p>
                        <p class="form-control-static">
                            首頁顯示額外內容：
                            <asp:TextBox ID="Com_more" runat="server" TextMode="MultiLine" CssClass="ckeditor" Rows="5"></asp:TextBox>
                        </p>

                        <p class="form-control-static" id="privatePanel" runat="server" visible="false">
                            隱私權政策內容：
                            <asp:TextBox ID="Com_private" runat="server" TextMode="MultiLine" CssClass="ckeditor" Rows="5"></asp:TextBox>
                        </p>

                    </div>
                </div>


                <div class="form-group">
                    <div class="col-sm-offset-2 col-sm-10">
                        <asp:LinkButton ID="editButton" runat="server" CssClass="btn btn-default" ValidationGroup="Required" OnClick="editButton_Click">送出</asp:LinkButton>
                        <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                    </div>
                </div>
            </div>

        </asp:Panel>

    </div>
    <!-- /.content_box -->

</asp:Content>

