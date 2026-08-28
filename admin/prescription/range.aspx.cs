using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using System.Collections;
using ez.data;

public partial class admin_prescription_range : ez.admin.PageBase
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            ez.language lan = new ez.language();
            if (lan.Load())
            {
                lan.InitOptions(nation, nationPanel);
                if (!isStrNull(Request["nation"])) { nation.SelectedValue = ValString(Request["nation"]); }
            }

            prescription prescription = new prescription();
            Repeater1.DataSource = prescription.RowDataTable(nation.SelectedValue);
            Repeater1.DataBind();
        }
       
    }
    
    protected void nation_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect( Request.Url.AbsolutePath +  "?nation=" + nation.SelectedValue);
    }

    #region 儲存

    protected void submitButton_Click(object sender, EventArgs e)
    {
        prescription prescription = new prescription();
        msg.Text = "";
        if (!isStrNull(sortNum.Value) && IsNumeric(sortNum.Value.Split(',')[0]))
        {
            if (prescription.SaveSort(sortNum.Value.Split(',').Select(x => int.Parse(x)).ToArray()))
            {
                ScriptMsg("儲存排序成功", Request.Url.AbsoluteUri);
            }
            else
            {
                ScriptMsg("儲存排序失敗");
                msg.Text = prescription.log;
            }
        }
        else
        {
            ScriptMsg("無排序資料");
        }
    }

    #endregion

  

    
}