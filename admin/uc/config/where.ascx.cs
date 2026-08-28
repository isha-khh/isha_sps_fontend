///89,,@電用在哪
///說明：排序,要檢查的選單代碼,要檢查的權限名稱@頁籤名稱

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class admin_uc_config_recaptcha : System.Web.UI.UserControl, ConfigExtendUC
{
    public string category = "where";

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            configExtend c = new configExtend(category);
            string parameters = "display_quantity";
            DataTable dt = c.GetSetView(parameters.Split(','));
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                display_quantity.Value = c.ValString(row["display_quantity"]);

            }
        }
    }

    public void GetMode(bool IsDesginMode)
    {
        if (IsDesginMode)
        {

        }
    }

    public void SaveConfig()
    {
        List<configExtend.SetOption> SetOptions = new List<configExtend.SetOption>();

        configExtend.SetOption Option = new configExtend.SetOption();

        Option.parameter = "display_quantity";
        Option.data = display_quantity.Value.Trim();
        SetOptions.Add(Option);

        configExtend c = new configExtend(category);
        c.SaveSetView(SetOptions);


    }
}