using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Collections;
using System.Data;
using ez.data;

public partial class admin_template_framesets : ez.admin.PageBase
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!Page.IsPostBack)
        {
            templateInit();             
        }
    }

    protected void templateInit()
    {
        framesets framesets = new framesets();
        DataTable dt = framesets.WrpRowTable();
        if (dt.Rows.Count > 0)
        {
            foreach (DataRow row in dt.Rows)
            {
                template_wrp.Items.Add(new ListItem(row["Title"].ToString(), row["ID"].ToString()));
            }
            Repeater1.DataSource = dt;
            Repeater1.DataBind();
        }

        framesets.Load();
        template_wrp.SelectedValue = framesets.Config.wrpCssID;
        framePostionShow();
    }

    protected void submitButton_Click(object sender, EventArgs e)
    {
        msg2.Text = "";

        framesets framesets = new framesets();
        framesets.ConfigInfo Config = new framesets.ConfigInfo();

        Config.wrpCssID = "";
        Config.wrpCssFilePath = "";

        if (template_wrp.SelectedIndex > 0)
        {
            foreach (RepeaterItem rItem in Repeater1.Items)
            {
                if (((HiddenField)rItem.FindControl("ID")).Value == template_wrp.SelectedValue)
                {
                    Config.wrpCssID = ((HiddenField)rItem.FindControl("ID")).Value;
                    Config.wrpCssFilePath = ((HiddenField)rItem.FindControl("CssFile")).Value;
                    break;
                }
            }
        }

        framesets.Config = Config;     

        if (framesets.Save())
        {
            framePostionSave();
            ScriptMsg("更新成功");
        }
        else
        {
            ScriptMsg("更新失敗");
            msg2.Text = framesets.log;
        }
    }

    protected void template_wrp_SelectedIndexChanged(object sender, EventArgs e)
    {
        framePostionShow();
    }


    #region 主題位置

    protected void framePostionShow()
    {

        frame_top.Value = "";
        frame_left.Value = "";
        frame_zindex.SelectedIndex = 0;
        frame_display.SelectedIndex = 0;

        if (!isStrNull(template_wrp.SelectedValue))
        {
            string tn = template_wrp.SelectedValue;
            string[] frame = { "frame_" + tn + "_top", "frame_" + tn + "_left", "frame_" + tn + "_zindex", "frame_" + tn + "_display" };
            configExtend c = new configExtend("frame");
            DataTable dt = c.GetSetView(frame);
            if (dt.Rows.Count > 0)
            {
                DataRow row = dt.Rows[0];
                frame_top.Value = ValString(row[frame[0]]);
                frame_left.Value = ValString(row[frame[1]]);
                frame_zindex.SelectedValue = ValString(row[frame[2]]);
                frame_display.SelectedValue = ValString(row[frame[3]]);
            }

        }

    }

    protected void framePostionSave()
    {
         if (!isStrNull(template_wrp.SelectedValue))
         {
             string tn = template_wrp.SelectedValue;
             string[] frame = { "frame_" + tn + "_top", "frame_" + tn + "_left", "frame_" + tn + "_zindex", "frame_" + tn + "_display" };
             List<configExtend.SetOption> SetOptions = new List<configExtend.SetOption>();
          
             configExtend.SetOption Option = new configExtend.SetOption();
             Option.parameter = frame[0];
             Option.data = frame_top.Value.Trim();
             SetOptions.Add(Option);

             Option = new configExtend.SetOption();
             Option.parameter = frame[1];
             Option.data = frame_left.Value.Trim();
             SetOptions.Add(Option);

             Option = new configExtend.SetOption();
             Option.parameter = frame[2];
             Option.data = frame_zindex.SelectedValue;
             SetOptions.Add(Option);

             Option = new configExtend.SetOption();
             Option.parameter = frame[3];
             Option.data = frame_display.SelectedValue;
             SetOptions.Add(Option);

             configExtend c = new configExtend("frame");
             c.SaveSetView(SetOptions);

         }
    }
    
    #endregion
    

}