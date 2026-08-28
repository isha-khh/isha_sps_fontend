<%@ Control Language="C#" AutoEventWireup="true" CodeFile="subnav.ascx.cs" Inherits="admin_uc_config_subnav" %>

<div class="col-sm-10">       
    <asp:PlaceHolder ID="pageP" runat="server" visible ="false">

         <label class="checkbox-inline">
                                     <input type="checkbox" id="subnav_open" runat="server" data-toggle="toggle" data-on="開" data-off="關" data-onstyle="success"   />                         
                開啟下拉選單
          </label>   
        <p  class="form-control-static"></p>
         <label class="checkbox-inline">
                                     <input type="checkbox" id="subnav_hashover" runat="server" data-toggle="toggle" data-on="開" data-off="關" data-onstyle="success"   />                         
                滑動顯示子選單模式
          </label>   
                     
            </asp:PlaceHolder>
          <asp:PlaceHolder ID="pageP2" runat="server" visible ="false">
                   <p  class="form-control-static">          
                      * 以上設定只有最大管理者才能設定
                      </p>
    </asp:PlaceHolder>

                    </div>