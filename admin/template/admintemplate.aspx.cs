using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Collections;
using System.Data;
using ez.data;

public partial class admin_admintemplate : ez.admin.PageBase
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!Page.IsPostBack)
        {                                

            template template = new template();
            template.Load();

            DataTable dt = template.AdminTemplateList();
            if (dt.Rows.Count > 0)
            {
                foreach (DataRow row in dt.Rows)
                {
                    TemplateMaster.Items.Add(new ListItem(ValString(row["title"]), ValString(row["file"])));
                }

                Repeater1.DataSource = dt;
                Repeater1.DataBind();

            }

            TemplateMaster.SelectedValue = template.Data.AdminTemplate;
            SwitchDescription();

        }
    }

    protected void SwitchDescription()
    {
        for (int i = 0; i < Repeater1.Items.Count; i++)
        {
            if (i == TemplateMaster.SelectedIndex)
            {
                ((PlaceHolder)Repeater1.Items[i].FindControl("PlaceHolder1")).Visible = true;
            }
            else
            {
                ((PlaceHolder)Repeater1.Items[i].FindControl("PlaceHolder1")).Visible = false;
            }
        }       
    }

    protected void TemplateMaster_SelectedIndexChanged(object sender, EventArgs e)
    {
        SwitchDescription();  
    }



    protected void submitButton_Click(object sender, EventArgs e)
    {
        msg.Text = "";

        template template = new template();
        template.Load();
        template.Data.AdminTemplate = TemplateMaster.SelectedValue;
        if (template.Save())
        {
            ScriptMsg("變更成功", Request.Url.AbsoluteUri);
        }
        else
        {
            ScriptMsg("變更失敗");
            msg.Text = template.log;
        }

    }
}