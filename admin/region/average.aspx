<%@ Page Title="" Language="C#" MasterPageFile="~/admin/Templates/Template001/default.master" AutoEventWireup="true" CodeFile="average.aspx.cs" ValidateRequest="false" Inherits="admin_region_average" %>

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
        <div class="panel panel-default">
            <asp:Panel ID="Panel1" runat="server" CssClass="panel-body form-horizontal" role="form" DefaultButton="submitButton">
                <asp:Panel ID="nationPanel" runat="server" CssClass="form-group">
                    <asp:DropDownList ID="nation" runat="server" CssClass="form-control" AutoPostBack="true" OnSelectedIndexChanged="NC_SelectedIndexChanged">
                    </asp:DropDownList>
                </asp:Panel>
                <div class="table_wrapper">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>居住地區</th>
                                <th>人口數</th>
                                <th>年平均用電度數</th>
                            </tr>
                        </thead>
                        <tbody>
                            <asp:Repeater ID="areaRepeater" runat="server" OnItemDataBound="areaRepeater_ItemDataBound">
                                <ItemTemplate>
                                    <asp:Repeater ID="populationRepeater" runat="server" OnItemDataBound="populationRepeater_ItemDataBound">
                                        <ItemTemplate>
                                            <tr>
                                                <td>
                                                    <asp:Literal ID="area" runat="server"></asp:Literal></td>
                                                <td><%#Container.DataItem.ToString().Split('|')[1] %><asp:HiddenField ID="population" runat="server" />
                                                </td>
                                                <td>
                                                    <input type="text" class="form-control" id="value" runat="server" placeholder="用電度數" maxlength="25" style="width: 120px; display: inline" />
                                                    <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="value" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                                    <asp:RegularExpressionValidator ControlToValidate="value" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required" ID="RegularExpressionValidator3" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" />
                                                </td>
                                            </tr>
                                        </ItemTemplate>
                                    </asp:Repeater>
                                </ItemTemplate>
                            </asp:Repeater>
                            <tr>
                                <td>全國</td>
                                <td></td>
                                <td>
                                    <input type="text" class="form-control" id="value" runat="server" placeholder="用電度數" maxlength="25" style="width: 120px; display: inline" />
                                    <asp:RequiredFieldValidator ID="RequiredFieldValidator2" runat="server" ControlToValidate="value" ValidationGroup="Required" Display="Dynamic" SetFocusOnError="true" ErrorMessage="必填"></asp:RequiredFieldValidator>
                                    <asp:RegularExpressionValidator ControlToValidate="value" Display="Dynamic" SetFocusOnError="true" ErrorMessage="只能輸入數字" ValidationGroup="Required" ID="RegularExpressionValidator3" runat="server" ValidationExpression="^(-?\d+)(\.\d+)?$" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="panel-heading">
                    <asp:Button ID="submitButton" runat="server" Text="儲存" CssClass="btn btn-default" OnClick="submitButton_Click" ValidationGroup="Required" />
                    <asp:Label ID="msg" runat="server" ForeColor="Red"></asp:Label>
                </div>
            </asp:Panel>
        </div>


    </div>
    <!-- /.content_box -->

</asp:Content>

