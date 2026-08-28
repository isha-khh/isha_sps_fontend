<%@ Control Language="C#" AutoEventWireup="true" CodeFile="visible.ascx.cs" Inherits="admin_uc_config_visible" %>

<div class="col-sm-10">

    <div class="form-group">
        <label for="user_id" class="col-sm-2 control-label">電器耗電比較</label>
        <div class="col-sm-10">
            <label class="checkbox-inline">
                <input type="checkbox" id="prescription" runat="server" data-toggle="toggle" data-on="顯示" data-off="關閉" data-onstyle="success" data-offstyle="info" />
            </label>
        </div>
    </div>
    <div class="form-group">
        <label for="user_id" class="col-sm-2 control-label">節能電器推薦</label>
        <div class="col-sm-10">
            <label class="checkbox-inline">
                <input type="checkbox" id="company" runat="server" data-toggle="toggle" data-on="顯示" data-off="關閉" data-onstyle="success" data-offstyle="info" />
            </label>
        </div>
    </div>
    <div class="form-group">
        <label for="user_id" class="col-sm-2 control-label">用電設備承裝/維護站</label>
        <div class="col-sm-10">
            <label class="checkbox-inline">
                <input type="checkbox" id="store" runat="server" data-toggle="toggle" data-on="顯示" data-off="關閉" data-onstyle="success" data-offstyle="info" />
            </label>
        </div>
    </div>
</div>
