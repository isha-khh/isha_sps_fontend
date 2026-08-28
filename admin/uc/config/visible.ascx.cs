///90,,@顯示設定
///說明：排序,要檢查的選單代碼,要檢查的權限名稱@頁籤名稱

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class admin_uc_config_visible : System.Web.UI.UserControl, ConfigExtendUC
{
    public string category = "visible";

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            configExtend c = new configExtend(category);
            string parameters = "prescription,company,store";
            DataTable dt = c.GetSetView(parameters.Split(','));
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                prescription.Checked = (c.ValString(row["prescription"]) == "Y");
                company.Checked = (c.ValString(row["company"]) == "Y");
                store.Checked = (c.ValString(row["store"]) == "Y");
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

        Option.parameter = "prescription";
        Option.data = prescription.Checked ? "Y" : "";
        SetOptions.Add(Option);

        Option.parameter = "company";
        Option.data = company.Checked ? "Y" : "";
        SetOptions.Add(Option);

        Option.parameter = "store";
        Option.data = store.Checked ? "Y" : "";
        SetOptions.Add(Option);

        configExtend c = new configExtend(category);
        c.SaveSetView(SetOptions);


    }
}