using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Data;
using System.Data.OleDb;
using ez.admin;

public partial class admin_item_ver : ez.admin.PageBase
{

    configuration.Modules cModules = new configuration.Modules();
    DataTable ModuleList;

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            ModuleList = cModules.List();
            configuration configuration = new configuration();
            Repeater1.DataSource = configuration.ModuleVerList();
            Repeater1.DataBind();
        }
    }

    protected void Repeater1_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView row = (DataRowView)e.Item.DataItem;
        if (ModuleList.Rows.Count > 0)
        {
            foreach (DataRow mRow in ModuleList.Rows)
            {
                if (ValString(row["Module"]) == ValString(mRow["module"]))
                {
                    ((CheckBox)e.Item.FindControl("CheckBox1")).Checked = true;
                    break;
                }
            }
        }     
    }
    
    protected void CheckBox1_CheckedChanged(object sender, EventArgs e)
    {        
        bool chk = ((CheckBox)sender).Checked;
        RepeaterItem rItem = (RepeaterItem)((CheckBox)sender).NamingContainer;
        string module = ((Literal)rItem.FindControl("Literal1")).Text.Trim();
        if (chk)
        {
            cModules.Add(module);
            if (cModules.log != "") { ScriptMsgAjax(cModules.log); }
        }
        else
        {
            cModules.Del(module);
            if (cModules.log != "") { ScriptMsgAjax(cModules.log); }
        }
    }

 
}