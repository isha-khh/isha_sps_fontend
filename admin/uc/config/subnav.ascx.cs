///91,S011,@下拉選單
///說明：排序,要檢查的選單代碼,要檢查的權限名稱@頁籤名稱

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class admin_uc_config_subnav : System.Web.UI.UserControl, ConfigExtendUC
{

    public string category = "subnav";
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            configExtend c = new configExtend(category);
            string parameters = "subnav_hashover,subnav_open";
            DataTable dt = c.GetSetView(parameters.Split(','));
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                subnav_hashover.Checked = (c.ValString(row["subnav_hashover"]) == "Y" ? true : false);
                subnav_open.Checked = (c.ValString(row["subnav_open"]) == "Y" ? true : false);
                //subnav_hasSecT.Checked = (c.ValString(row["subnav_hasSecT"]) == "Y" ? true : false);
                //subnav_hasTiltle.Checked = (c.ValString(row["subnav_hasTiltle"]) == "Y" ? true : false);
            }       
        }
    }

    public void GetMode(bool IsDesginMode)
    {
        if (IsDesginMode)
        {
            pageP.Visible = true;
            pageP2.Visible = true;
        }
    }

    public void SaveConfig()
    {
        List<configExtend.SetOption> SetOptions = new List<configExtend.SetOption>();

        configExtend.SetOption Option = new configExtend.SetOption();
        Option.parameter = "subnav_hashover";
        Option.data = (subnav_hashover.Checked ? "Y" : "N");
        SetOptions.Add(Option);

        Option = new configExtend.SetOption();
        Option.parameter = "subnav_open";
        Option.data = (subnav_open.Checked ? "Y" : "N");
        SetOptions.Add(Option);

        //Option = new configExtend.SetOption();
        //Option.parameter = "subnav_hasTiltle";
        //Option.data = (subnav_hasTiltle.Checked ? "Y" : "N");
        //SetOptions.Add(Option);

        //Option = new configExtend.SetOption();
        //Option.parameter = "subnav_hasSecT";
        //Option.data = (subnav_hasSecT.Checked ? "Y" : "N");
        //SetOptions.Add(Option);

        configExtend c = new configExtend(category);
        c.SaveSetView(SetOptions);

    
    }

}