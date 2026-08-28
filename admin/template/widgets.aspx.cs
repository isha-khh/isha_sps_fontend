using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Collections;
using System.Data;
using ez.data;

public partial class admin_template_widgets : ez.admin.PageBase
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!Page.IsPostBack)
        {
            //載入單元
            sitemap sitemap = new sitemap();
            foreach (DataRow row in sitemap.XmlTable.Rows)
            {
                string urlValue =row["url"].ToString().Replace("~/", "");
                if (!isStrNull(urlValue))
                {
                    Category.Items.Add(new ListItem(row["title"].ToString(), urlValue));
                }               
            }


            //載入uc清單        
            widgets widgets = new widgets();
            DataTable dt = widgets.UserControlTable();
            foreach (DataRow row in dt.Rows)
            {
                UserControl.Items.Add(new ListItem(row["Title"].ToString(), row["File"].ToString()));
            }
         
        }
    }

    protected void Category_SelectedIndexChanged(object sender, EventArgs e)
    {
        if (Category.SelectedIndex > 0)
        {
            PlaceHolder1.Visible = true;
            widgetsInit();  //選單配置
        }
        else
        {
            PlaceHolder1.Visible = false;
        }
    }

    protected void widgetsInit()
    {
        WidgetsLeftValue.Value = "";
        WidgetsRightValue.Value = "";
     
        //載入設定 
        widgets widgets = new widgets();
        widgets.Load(Category.SelectedValue);
        //msg3.Text = widgets.log;
        if (widgets.Config.side1_bottom_widgets.Count > 0)
        {
            foreach (string dOption in widgets.Config.side1_bottom_widgets) {
                if (chkInUC(dOption))
                {
                    WidgetsLeftValue.Value += (!isStrNull(WidgetsLeftValue.Value) ? "," : "") + dOption; 
                }             
            }
        }
        if (widgets.Config.side2_bottom_widgets.Count > 0)
        {
            foreach (string dOption in widgets.Config.side2_bottom_widgets) {
                if (chkInUC(dOption))
                {
                    WidgetsRightValue.Value += (!isStrNull(WidgetsRightValue.Value) ? "," : "") + dOption; 
                }               
            }
        }
        widgetsList(WidgetsLeftValue, WidgetsRepeaterLeft);
        widgetsList(WidgetsRightValue, WidgetsRepeaterRight);
    }

    protected bool chkInUC(string value)
    {
        bool chk = false;
        foreach (ListItem oItem in UserControl.Items){
            if (oItem.Value == value)
            {
                chk = true;
                break;
            }
        }
        return chk;
    }

    protected void widgetsAdd_Click(object sender, EventArgs e)
    {
        if (Page.IsValid)
        {
            if (WidgetsSet.SelectedValue == "Left")
            {
                widgetsJoin(WidgetsLeftValue);
                widgetsList(WidgetsLeftValue, WidgetsRepeaterLeft);
            }
            else if (WidgetsSet.SelectedValue == "Right")
            {
                widgetsJoin(WidgetsRightValue);
                widgetsList(WidgetsRightValue, WidgetsRepeaterRight);
            }
            savewidgets();
        }
    }

    protected void widgetsList(HiddenField ListValues, Repeater WidgetsRepeater)
    {
        DataTable dt = new DataTable();
        dt.Columns.Add("Title");
        dt.Columns.Add("Name");
        dt.Columns.Add("Range");
        if (!isStrNull(ListValues.Value))
        {
            string[] widgetss = ListValues.Value.Split(',');
            for (int i = 0; i < widgetss.Length; i++)
            {
                DataRow tr = dt.NewRow();
                tr["Title"] = widgetsTitle(widgetss[i]);
                tr["Name"] = widgetss[i];
                tr["Range"] = i.ToString();
                dt.Rows.Add(tr);
            }
        }     
        WidgetsRepeater.DataSource = dt;
        WidgetsRepeater.DataBind();
    }

    protected void WidgetsRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView row = (DataRowView)e.Item.DataItem;
        if (Val(row["Range"]) == 0)
        {
            ((LinkButton)e.Item.FindControl("upMovie")).Enabled = false;
        }

        string LR = ((Repeater)sender).ID.Replace("WidgetsRepeater", "");
        int RangeMax = ((HiddenField)Panel3.FindControl("Widgets" + LR + "Value")).Value.Split(',').Length - 1;

        if (Val(row["Range"]) == RangeMax)
        {
            ((LinkButton)e.Item.FindControl("downMovie")).Enabled = false;
        }
    }

    protected string widgetsTitle(string Value)
    {
        string Title = "";
        foreach (ListItem dItem in UserControl.Items)
        {
            if (dItem.Value == Value)
            {
                Title = dItem.Text;
                break;
            }
        }
        return Title;
    }

    protected void widgetsJoin(HiddenField ListValues)
    {
        if (("," + WidgetsLeftValue.Value + ",").IndexOf("," + UserControl.SelectedValue + ",") > -1)
        {
            ScriptMsgAjax("已存在左側清單內，請勿重複加入");
        }
        else if (("," + WidgetsRightValue.Value + ",").IndexOf("," + UserControl.SelectedValue + ",") > -1)
        {
            ScriptMsgAjax("已存在右側清單內，請勿重複加入");
        }
        else
        {
            ListValues.Value += (!isStrNull(ListValues.Value) ? "," : "") + UserControl.SelectedValue;
        }
    }

    protected void widgetsMovie_Click(object sender, EventArgs e)
    {
        string LR = ((LinkButton)sender).NamingContainer.NamingContainer.ID.Replace("WidgetsRepeater", "");
        RepeaterItem rItem = (RepeaterItem)((LinkButton)sender).NamingContainer;
        string rName =((HiddenField)rItem.FindControl("Name")).Value;
        int rRange = Val(((HiddenField)rItem.FindControl("Range")).Value);
        HiddenField ListValues = (HiddenField)Panel3.FindControl("Widgets" + LR + "Value");
        Repeater WidgetsRepeater = (Repeater)((LinkButton)sender).NamingContainer.NamingContainer;
        if (((LinkButton)sender).ID == "upMovie")
        {
            movieProccess(WidgetsRepeater, ListValues, rName, rRange - 1);
        }
        else if (((LinkButton)sender).ID == "downMovie")
        {
            movieProccess(WidgetsRepeater, ListValues, rName, rRange + 1);
        }
        else if (((LinkButton)sender).ID == "rightMovie")
        {
            movieProccess2(WidgetsRepeater, ListValues, rName, (LR == "Left" ? "Right" : "Left"));
        }
        else if (((LinkButton)sender).ID == "leftMovie")
        {
            movieProccess2(WidgetsRepeater, ListValues, rName, (LR == "Left" ? "Right" : "Left"));
        }
        savewidgets();
    }
   
    protected void movieProccess( Repeater WidgetsRepeater, HiddenField ListValues, string rName, int rRange)
    {
        if (!isStrNull(ListValues.Value))
        {          
            string[] ds = ListValues.Value.Split(',');
            ListValues.Value = "";
            for (int i = 0; i < ds.Length; i++)
            {
                bool _Continue = true;
                if (i == rRange)
                {
                    if (i - 1 >=0)
                    {
                        if (ds[i - 1] == rName)
                        {
                            ListValues.Value += (!isStrNull(ListValues.Value) ? "," : "") + ds[i];
                            _Continue = false;
                        }
                    }
                    ListValues.Value += (!isStrNull(ListValues.Value) ? "," : "") + rName;                  
                }
                if (ds[i] != rName && _Continue)
                {
                    ListValues.Value += (!isStrNull(ListValues.Value) ? "," : "") + ds[i];
                }                
             
            }
            widgetsList(ListValues, WidgetsRepeater);
        }    
    }


    protected void movieProccess2(Repeater WidgetsRepeater, HiddenField ListValues, string rName, string LR)
    {
        if (!isStrNull(ListValues.Value))
        {
            string[] ds = ListValues.Value.Split(',');
            ListValues.Value = "";
            for (int i = 0; i < ds.Length; i++)
            {
                if (ds[i] != rName)
                {
                    ListValues.Value += (!isStrNull(ListValues.Value) ? "," : "") + ds[i];
                }
            }
            widgetsList(ListValues, WidgetsRepeater);

            HiddenField ListValues2 = (HiddenField)Panel3.FindControl("Widgets" + LR + "Value");
            Repeater WidgetsRepeater2 = (Repeater)Panel3.FindControl("WidgetsRepeater" + LR);
            ListValues2.Value += (!isStrNull(ListValues2.Value) ? "," : "") + rName;
            widgetsList(ListValues2, WidgetsRepeater2);
        }
    }

    protected void delete_Click(object sender, EventArgs e)
    {
        string LR = ((LinkButton)sender).NamingContainer.NamingContainer.ID.Replace("WidgetsRepeater", "");
        RepeaterItem rItem = (RepeaterItem)((LinkButton)sender).NamingContainer;
        string rName = ((HiddenField)rItem.FindControl("Name")).Value;
        HiddenField ListValues = (HiddenField)Panel3.FindControl("Widgets" + LR + "Value");
        Repeater WidgetsRepeater = (Repeater)((LinkButton)sender).NamingContainer.NamingContainer;

        string[] ds = ListValues.Value.Split(',');
        ListValues.Value = "";
        foreach (string d in ds)
        {
            if (d != rName)
            {
                ListValues.Value += (!isStrNull(ListValues.Value) ? "," : "") + d;
            }            
        }
        widgetsList(ListValues, WidgetsRepeater);
        savewidgets();
    }

    protected void savewidgets()
    {
        msg3.Text = "";
        widgets.ConfigInfo Config = new widgets.ConfigInfo();
        widgets widgets = new widgets();
        DataTable ucTable = widgets.UserControlTable();
        if (ucTable.Rows.Count > 0)
        {
            if (!isStrNull(WidgetsLeftValue.Value))
            {
                string[] ds = WidgetsLeftValue.Value.Split(',');
                foreach (string d in ds)
                {
                    string dOption = getwidgetsOption(d, ucTable);
                    if (!isStrNull(dOption)) { Config.side1_bottom_widgets.Add(dOption); }                  
                }
            }
            if (!isStrNull(WidgetsRightValue.Value))
            {
                string[] ds = WidgetsRightValue.Value.Split(',');
                foreach (string d in ds)
                {
                    string dOption = getwidgetsOption(d, ucTable);
                    if (!isStrNull(dOption)) { Config.side2_bottom_widgets.Add(dOption); }                 
                }
            }       
        }
     
        widgets.Config = Config;     
        if (widgets.Save(Category.SelectedValue))
        {
            //ScriptMsgAjax("更新成功");
        }
        else
        {
            ScriptMsgAjax("更新失敗");
            msg3.Text = widgets.log;
        }
    }

    protected string getwidgetsOption(string Name, DataTable ucTable)
    {
        string dOption = "";
        foreach (DataRow row in ucTable.Rows)
        {
            if (row["File"].ToString() == Name)
            {
                dOption = Name;
                break;
            }
        }
        return dOption;
    }








}