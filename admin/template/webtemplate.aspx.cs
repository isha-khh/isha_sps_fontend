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
using System.Web.Optimization;

public partial class admin_webtemplate : ez.admin.PageBase
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!Page.IsPostBack)
        {                                

            template template = new template();
            template.Load();

            DataTable dt = template.WebTemplateList();
            if (dt.Rows.Count > 0)
            {
                
                foreach (DataRow row in dt.Rows)
                {
                    TemplateMaster.Items.Add(new ListItem(ValString(row["title"]), ValString(row["file"])));
                    ViewState["HomeContent"] += ValString(row["HomeContent"]) + ",";
                }

                Repeater1.DataSource = dt;
                Repeater1.DataBind();

            }

            TemplateMaster.SelectedValue = template.Data.WebTemplate;
            
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

        TemplateBackgoundShow();

    }

    protected void TemplateBackgoundShow()
    {
        string[] n = TemplateMaster.SelectedValue.Split('/');
        string tn = n[n.Length - 2];

        string[] bgimg = { "template_" + tn + "_hbg", "template_" + tn + "_bg", "template_" + tn + "_htbg", "template_" + tn + "_tbg" };
    
        configExtend c = new configExtend("template");
        DataTable dt = c.GetSetView(bgimg);
        if (dt.Rows.Count > 0)
        {
            template template = new template();
            DataRow row = dt.Rows[0];
            for (int i = 0; i < bgimg.Length; i++)
            {
                string pic = c.ValString(row[bgimg[i]]);
                ((HiddenField)PlaceHolder2.FindControl("pic" + (i + 1).ToString())).Value = pic;
                ((CheckBox)PlaceHolder2.FindControl("delpic" + (i + 1).ToString())).Checked = false;
                ((CheckBox)PlaceHolder2.FindControl("delpic" + (i + 1).ToString())).Visible = (isStrNull(pic) ? false : true);
                ((HyperLink)PlaceHolder2.FindControl("HyperLink" + (i + 1).ToString())).Visible = (isStrNull(pic) ? false : true);
                if (!isStrNull(pic))
                {
                    ((HyperLink)PlaceHolder2.FindControl("HyperLink" + (i + 1).ToString())).NavigateUrl = template.Dir + pic;
                    ((Image)PlaceHolder2.FindControl("Image" + (i + 1).ToString())).ImageUrl = template.Dir + pic;
                }
            }
        }
        else
        {
            for (int i = 0; i < bgimg.Length; i++)
            {
                ((HiddenField)PlaceHolder2.FindControl("pic" + (i + 1).ToString())).Value = "";
                ((CheckBox)PlaceHolder2.FindControl("delpic" + (i + 1).ToString())).Checked = false;
                ((CheckBox)PlaceHolder2.FindControl("delpic" + (i + 1).ToString())).Visible = false;
                ((HyperLink)PlaceHolder2.FindControl("HyperLink" + (i + 1).ToString())).Visible = false;
            }
        }

        string[] bgrepeat = { "template_" + tn + "_hrepeat", "template_" + tn + "_repeat", "template_" + tn + "_htrepeat", "template_" + tn + "_trepeat" };
        for (int i = 0; i < bgrepeat.Length; i++) { ((DropDownList)PlaceHolder2.FindControl("repeat" + (i + 1).ToString())).SelectedIndex = 0; }
        c = new configExtend("template");
        dt = c.GetSetView(bgrepeat);
        if (dt.Rows.Count > 0)
        {
            DataRow row = dt.Rows[0];
            for (int i = 0; i < bgrepeat.Length; i++)
            {
                string repeat = c.ValString(row[bgrepeat[i]]);
                if (!isStrNull(repeat))
                {
                    ((DropDownList)PlaceHolder2.FindControl("repeat" + (i + 1).ToString())).SelectedValue = repeat;
                }
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
        template.Data.WebTemplate = TemplateMaster.SelectedValue;        
        template.Data.HomeContent = ValString(ViewState["HomeContent"]).Split(',')[TemplateMaster.SelectedIndex];
        if (template.Save())
        {

            ez.fileSystem fileSystem = new ez.fileSystem();
            string[] pic_name = fileSystem.Upload(template.Dir);


            string[] n = TemplateMaster.SelectedValue.Split('/');
            string tn = n[n.Length - 2];
            string[] bgimg = { "template_" + tn + "_hbg", "template_" + tn + "_bg", "template_" + tn + "_htbg", "template_" + tn + "_tbg" };
            for (int i = 0; i < bgimg.Length; i++)
            {
                CheckBox delpic = (CheckBox)PlaceHolder2.FindControl("delpic" + (i + 1).ToString());
                if (!isStrNull(pic_name[i]) || delpic.Checked)
                {
                    List<configExtend.SetOption> SetOptions = new List<configExtend.SetOption>();

                    configExtend.SetOption Option = new configExtend.SetOption();
                    Option.parameter = bgimg[i];
                    Option.data = ValString(pic_name[i]);
                    SetOptions.Add(Option);
                    configExtend c = new configExtend("template");
                    c.SaveSetView(SetOptions);

                    string delFile = ((HiddenField)PlaceHolder2.FindControl("pic" + (i + 1).ToString())).Value;
                    if (!isStrNull(delFile))
                    {
                        fileSystem.Delete(template.Dir + delFile);
                    }

                }
            }

            string[] bgrepeat = { "template_" + tn + "_hrepeat", "template_" + tn + "_repeat", "template_" + tn + "_htrepeat", "template_" + tn + "_trepeat" };
            for (int i = 0; i < bgrepeat.Length; i++)
            {
                List<configExtend.SetOption> SetOptions = new List<configExtend.SetOption>();

                configExtend.SetOption Option = new configExtend.SetOption();
                Option.parameter = bgrepeat[i];
                Option.data = ((DropDownList)PlaceHolder2.FindControl("repeat" + (i + 1).ToString())).SelectedValue;
                SetOptions.Add(Option);
                configExtend c = new configExtend("template");
                c.SaveSetView(SetOptions);
            }

            TemplateBackgoundShow();

            ScriptMsg("變更成功");

            BundleConfig.RegisterBundles(BundleTable.Bundles); //bundle重新註冊
        }
        else
        {
            ScriptMsg("變更失敗");
            msg.Text = template.log;
        }
      

    }
}