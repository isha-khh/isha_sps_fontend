using System;
using System.Web.UI;

public partial class admin_forget : ez.function, MasterToAdminIndex
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
                if (user.SendPassword(u_id.Value, email.Value))
                {
                    ScriptMsg("密碼通知信已發送，請至您的信箱收取", "index.aspx");
                }
                else
                {
                    if (user.log == "Lock") { msg.Text = ez.admin.user.supervisor.effective_day + "天未更改密碼帳號已上鎖"; }
                    else
                    {
                        msg.Text = user.log;
                    }
                }
            }
        }
    }

    public void setDesignMode(bool inMode)
    {

    }


    protected void goback_Click(object sender, EventArgs e)
    {
        Response.Redirect("index.aspx");
    }
}