using ez.data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;


public partial class admin_region_average : ez.admin.PageBase
{
    public int area_id { get; set; }
    public string area { get; set; }
    public List<region.use.DataInfo> list { get; set; }
    region region = new region();

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
                region.use use = new region.use();
                list = use.List(nation.SelectedValue);
                value.Value = list.Where(w => w.area == 0 && w.population == 0).Select(s => s.value).FirstOrDefault().ToString();

                areaRepeater.DataSource = region.areaValue;
                areaRepeater.DataBind();
            }
        }

    }

    protected void areaRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        area_id = e.Item.ItemIndex;
        area = e.Item.DataItem.ToString();
        Repeater populationRepeater = (Repeater)e.Item.FindControl("populationRepeater");
        populationRepeater.DataSource = region.populationValue;
        populationRepeater.DataBind();
    }

    protected void populationRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        int population = Val(e.Item.DataItem.ToString().Split('|')[0]);
        ((HiddenField)e.Item.FindControl("population")).Value = population.ToString();
        ((Literal)e.Item.FindControl("area")).Text = area + "氣候區";
        if (list.Count > 0)
        {
            var val = list.Where(w => w.area == area_id && w.population == population).Select(s => s.value).FirstOrDefault();
            ((HtmlInputControl)e.Item.FindControl("value")).Value = val.ToString();
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

            region.use use = new region.use();
            List<region.use.DataInfo> data = new List<region.use.DataInfo>();
            foreach (RepeaterItem aItem in areaRepeater.Items)
            {
                foreach (RepeaterItem Item in ((Repeater)aItem.FindControl("populationRepeater")).Items)
                {
                    data.Add(new region.use.DataInfo()
                    {
                        nation = nation.SelectedValue,
                        area = aItem.ItemIndex,
                        population = Val(((HiddenField)Item.FindControl("population")).Value.Trim()),
                        value = ValFloat(((HtmlInputControl)Item.FindControl("value")).Value.Trim())
                    });
                }
            }

            data.Add(new region.use.DataInfo()
            {
                nation = nation.SelectedValue,
                area = 0,
                population = 0,
                value = ValFloat(value.Value.Trim())
            });

            if (use.Save(data))
            {
                msg.Text = "更新成功";
            }
            else
            {
                msg.Text = use.log;
            }

        }
    }

    #endregion

}