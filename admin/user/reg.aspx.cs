using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using System.Configuration;
using System.Activities.Expressions;
using System.Text.RegularExpressions;
using Antlr.Runtime.Tree;
using ez;

public partial class admin_user_reg : ez.admin.PageBase
{

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            supervisor supervisor = new supervisor();
            supervisor.initGroup(power);
            PlaceHolder4.Visible = isDesignMode();

            if (!isStrNull(Request["num"]))
            {
                if (supervisor.Load(Val(Request["num"])))
                {
                    mode.Value = "edit";
                    PlaceHolder1.Visible = false;
                    supervisor.DataInfo info = supervisor.Data;
                    u_id.Value = info.u_id;
                    u_id2.Text = info.u_id;
                    PlaceHolder1.Visible = false;
                    PlaceHolder2.Visible = false;
                    PlaceHolder3.Visible = true;
                    u_name.Value = info.u_name;
                    email.Value = info.email;
                    power.SelectedValue = info.power;
                    online.SelectedValue = ((bool)info.online ? "1" : "0");
                    wrp_news.Checked = info.wrpNews.Value;
                    if (info.effective_date.HasValue) { effective_date.Value = ValDate(info.effective_date).ToString("yyyy-MM-dd"); }
                    demo.Text = info.demo;
                }
                else
                {
                    Response.Write(supervisor.log);
                    ScriptMsg("查無資料", "index.aspx" + rtnQueryString("num"));
                }
                goBack.Visible = true;
                goBack.NavigateUrl = "index.aspx" + rtnQueryString("num");

            }
            else
            {
                mode.Value = "add";
            }

        }

    }


    #region 新增/修改資料

    #region 驗證

    protected bool isVerificationOk()
    {
        msg.Text = "";

        if (isCyclicCharacters(u_password.Value.Trim()))
        {
            ScriptMsgAjax("勿循環性密碼如(wxy1234, wxy2345,...)");
            return false;
        }

        if (mode.Value.Trim() == "edit")
        {
            supervisor supervisor = new supervisor();
            if (supervisor.CheckHistoryPassword(Val(Request["num"]) , u_password.Value.Trim()))
            {
                ScriptMsgAjax(_t("密碼不得與前5次相同"));
                return false;
            }
        }

        return true;
    }

    #endregion



    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (IsValid && isVerificationOk())
        {
            msg.Text = "";

            supervisor supervisor = new supervisor();
            supervisor.DataInfo info = new supervisor.DataInfo();

            info.u_id = u_id.Value.Trim();
            info.u_password = u_password.Value.Trim();
            info.u_name = u_name.Value.Trim();
            info.email = email.Value.Trim();
            info.power = power.SelectedValue;
            info.online = (online.SelectedValue == "1" ? true : false);
            info.demo = demo.Text.Trim();
            info.wrpNews = wrp_news.Checked;
            if (!isStrNull(effective_date.Value)) { info.effective_date = ValDate(effective_date.Value); }            

            switch (mode.Value)
            {
                case "add":
                    supervisor.Data = info;
                    if (supervisor.Add()) { Response.Redirect("index.aspx"); }
                    else { msg.Text = supervisor.log; }
                    break;
                case "edit":
                    info.num = Val(Request["num"]);
                    supervisor.Data = info;
                    if (supervisor.Edit()) { Response.Redirect("index.aspx" + rtnQueryString("num")); }
                    else { msg.Text = supervisor.log; }
                    break;
                default:
                    break;
            }
        }
    }

    #endregion

    #region 變更密碼

    protected void changeButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg2.Text = "";
            supervisor supervisor = new supervisor();
            supervisor.DataInfo info = new supervisor.DataInfo();
            info.u_password = new_password.Value.Trim();
            info.num = Val(Request["num"]);
            supervisor.Data = info;
            if (supervisor.ChangePassword()) { ScriptMsg("密碼變更成功"); }
            else { msg2.Text = supervisor.log; }
        }
    }

    #endregion

    #region 檢查是否使用設計師模式

    public bool isDesignMode()
    {
        bool isDM = false;
        if (!isStrNull(ConfigurationManager.AppSettings["designIP"]))
        {
            string[] DesignIP = ConfigurationManager.AppSettings["designIP"].ToString().Split(',');
            string myIP = getIP();
            foreach (string chkIP in DesignIP)
            {
                if (chkIP == myIP)
                {
                    isDM = true;
                    break;
                }
            }
        }

        return isDM;
    }

    #endregion
}