using System;
using System.Web.UI;

public partial class admin_where_word : ez.admin.PageBase
{
    string category = "where_to_use";
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            ez.language lan = new ez.language();
            if (lan.Load())
            {
                lan.InitOptions(nation, nationPanel);
            }

            if (!isStrNull(Request["nation"]))
            {
                nation.SelectedValue = Request["nation"].ToString();
            }
            if (!isStrNull(nation.SelectedValue))
            {
                webword webword = new webword(category, nation.SelectedValue);
                if (webword.Load())
                {
                    subject.Text = webword.Data.subject;
                    word.Text = webword.Data.word;
                    status.SelectedValue = (webword.Data.status ? "Y" : "N");
                }
                else
                {
                    msg.Text = webword.log;
                }
            }
            else
            {
                PlaceHolder1.Visible = false;
            }


        }

    }

    protected void NC_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect(Request.Url.AbsolutePath + "?nation=" + nation.SelectedValue);
    }


    #region 新增/修改資料

    protected void submitButton_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {

            msg.Text = "";


            webword.DataInfo info = new webword.DataInfo();
            info.subject = subject.Text.Trim();
            info.word = word.Text.Trim();
            info.status = (status.SelectedValue == "Y");
            webword webword = new webword(category, nation.SelectedValue);
            webword.Data = info;
            if (webword.Save())
            {
                msg.Text = "更新成功";
            }
            else
            {
                msg.Text = webword.log;
            }

        }
    }

    #endregion





}