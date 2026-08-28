using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Newtonsoft.Json;

public partial class admin_index : ez.function, MasterToAdminIndex
{
    public ez.Recaptcha recaptcha = new ez.Recaptcha();

    protected override void OnPreInit(System.EventArgs e)
    {
        SetDetectXSS();

        ez.data.template template = new ez.data.template();
        template.Load();

        base.Page.MasterPageFile = template.Data.AdminTemplate;
        base.OnPreInit(e);

    }

    protected void Page_Load(object sender, EventArgs e)
    {
        if (ez.admin.PageBase.chkAdmIP && (ez.admin.PageBase.chkTwIP || ez.admin.PageBase.chkAdmIP_Enable))
        {
            if (!Page.IsPostBack)
            {
                ((BasePageToMaster)this.Page.Master).MasteBodyClass("home login");


                ez.data.info WebSet = new ez.data.info();
                WebSet.Load();
                com_name.Text = WebSet.Data.name;

                ez.admin.user user = new ez.admin.user();
                user.logout();


                if (recaptcha.Used)
                    MultiView1.ActiveViewIndex = 1;

                if (!isStrNull(Request["log"]))
                {
                    msg.Text = RemoveHTMLTag(Request["log"]);
                }

            }

        }
        else
        {
            Response.Clear();
            Response.StatusCode = 404;
            Response.End();
        }

    }

    protected void login_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";

            int LoginTryCount = Val(ConfigurationManager.AppSettings["LoginTryCount"].ToString());
            int LoginTryLockMin = Val(ConfigurationManager.AppSettings["LoginTryLockMin"].ToString());

            if (LoginTryCount > 0 && !isStrNull(Session[SC + "ezLgErr"]))
            {
                ezLgErr ezLgErr = JsonConvert.DeserializeObject<ezLgErr>(ValString(Session[SC + "ezLgErr"]));
                if (ezLgErr.count >= LoginTryCount && DateTime.Now < ezLgErr.reg_time.AddMinutes(LoginTryLockMin))
                {
                    TimeSpan ts = ezLgErr.reg_time.AddMinutes(LoginTryLockMin) - DateTime.Now;
                    ScriptJS("msgbox('您嘗試登入失敗太多次，請稍待 " + Math.Round(ts.TotalMinutes) + "  分鐘後再嘗試!','warning','')");
                    return;
                }

            }

            bool isOk = false;
            if (MultiView1.ActiveViewIndex == 0)
            {
                if (isStrNull(Session[SC + "_adminchk"]))
                {
                    msg.Text = "請重新點選驗證碼";
                }
                else if (Session[SC + "_adminchk"].ToString().ToUpper() == captcha.Value.ToUpper())
                {
                    isOk = true;
                }
                else
                {
                    msg.Text = "驗證碼輸入錯誤";
                }
            }
            else if (recaptcha.Verification())
            {
                isOk = true;
            }
            else
            {
                msg.Text = "驗證未通過！";
            }


            if (isOk)
            {
                ez.admin.user user = new ez.admin.user();
                if (user.login(u_id.Value, u_password.Value))
                {
                    if (user.log == "登入成功")
                    {
                        Response.Redirect("index2.aspx");
                    }
                    else
                    {
                        ScriptMsgAjax(user.log, "index2.aspx");
                    }
                }
                else
                {
                    if (user.log == "Lock") { msg.Text = ez.admin.user.supervisor.effective_day + "天未更改密碼帳號已上鎖"; }
                    else
                    {
                        msg.Text = user.log;

                        if (LoginTryCount > 0)
                        {
                            ezLgErr ezLgErr = new ezLgErr();
                            ezLgErr.count = 0;
                            if (!isStrNull(Session[SC + "ezLgErr"]))
                                ezLgErr = JsonConvert.DeserializeObject<ezLgErr>(ValString(Session[SC + "ezLgErr"]));
                            ezLgErr.count++;
                            ezLgErr.reg_time = DateTime.Now;
                            Session[SC + "ezLgErr"] = JsonConvert.SerializeObject(ezLgErr);
                        }
                    }
                }
            }


        }
    }

    public class ezLgErr
    {
        public int count;
        public DateTime reg_time;
    }


    #region 設計師模式

    public void setDesignMode(bool inMode)
    {
        loginDesign.Visible = inMode;
    }

    protected void loginDesign_Click(object sender, EventArgs e)
    {
        ez.admin.user user = new ez.admin.user();
        if (user.login("admin", null, true))
        {
            Response.Redirect("index2.aspx");
        }
        else
        {
            msg.Text = "登入失敗";
        }
    }

    #endregion



    protected void forget_Click(object sender, EventArgs e)
    {
        Response.Redirect("forget.aspx");
    }
}