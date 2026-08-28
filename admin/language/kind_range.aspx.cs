using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using System.Collections;
using ez;

public partial class admin_language_range : ez.admin.PageBase
{
    language language = new language();
    
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            Repeater1.DataSource = language.RowDataTable();
            Repeater1.DataBind();
        }
       
    }
         

    #region 儲存

    protected void submitButton_Click(object sender, EventArgs e)
    { 
        msg.Text = "";
        if (!isStrNull(sortNum.Value))
        {
            if (language.SaveSort(sortNum.Value.Split(',')))
            {
                ScriptMsg("儲存排序成功", Request.Url.AbsoluteUri);
            }
            else
            {
                ScriptMsg("儲存排序失敗");
                msg.Text = language.log;
            }
        }
        else
        {
            ScriptMsg("無排序資料");
        }
    }

    #endregion

  

    
}