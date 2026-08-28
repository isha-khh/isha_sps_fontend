using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Collections;

public partial class admin_user_email : ez.admin.PageBase
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!Page.IsPostBack)
        {

            ez.data.info WebSet = new ez.data.info();
            WebSet.Load();

            com_mail.Value = WebSet.Data.mail;
            bcc_mail.Text = WebSet.Data.bccStr;         
        
        }
    }

    protected void editButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            msg.Text = "";
            ez.data.info WebSet = new ez.data.info();
            ez.data.info.DataInfo info = new ez.data.info.DataInfo();
            info.mail = com_mail.Value.Trim();
            info.bccStr = bcc_mail.Text.Trim();
            WebSet.Data = info;
            if (WebSet.SaveMail())
            {
                ScriptMsg("更新成功");
            }
            else
            {
                ScriptMsg("更新失敗");
                msg.Text = WebSet.log;
            }
        }
    }

}