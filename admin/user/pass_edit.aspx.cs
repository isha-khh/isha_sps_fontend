using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using System.Web.Caching;

public partial class admin_user_pass_edit : ez.admin.PageBase
{

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            if (loginInfo.changePassword) { msg.Text = "基於安全性考量，申請重新設定密碼需強制變更。"; }
            supervisor supervisor = new supervisor();

            if (!isStrNull(loginInfo.Num))
            {
                if (supervisor.Load(Val(loginInfo.Num), false))
                {
                    supervisor.DataInfo info = supervisor.Data;
                    u_id.Text = info.u_id;
                    u_name.Text = info.u_name;
                }
                else
                {
                    Response.Write(supervisor.log);
                    ScriptMsg("查無資料", ResolveUrl("~/admin/index2.aspx"));
                }

            }
            else
            {
                Response.Redirect("~/admin/index.aspx");
            }

        }

    }


    #region 變更密碼

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";
            supervisor supervisor = new supervisor();
            supervisor.DataInfo info = new supervisor.DataInfo();
            info.u_password = new_password.Value.Trim();
            info.num = Val(loginInfo.Num);
            supervisor.Data = info;
            if (supervisor.ChangePassword()) { logout(); ScriptMsg("密碼變更成功，請重新登入！", "../index.aspx"); }
            else { msg.Text = supervisor.log; }
        }
    }

    #endregion



}