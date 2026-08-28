using ez.data;
using System;
using System.Data;
using System.Web.UI.WebControls;

public partial class home_recent_link : ez.web.controls.ControlBase
{
    link link = new link();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            DataTable dt = link.ShowTable(50, nation);
            if (dt.Rows.Count > 0)
            {
                LinkRepeater.DataSource = dt;
                LinkRepeater.DataBind();
            }
            if (!f.isStrNull(link.log)) { Response.Write(link.log); }
        }
    }

    protected void LinkRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView row = (DataRowView)e.Item.DataItem;
        HyperLink LinkA = (HyperLink)e.Item.FindControl("LinkA");
        LinkA.Attributes["onclick"] = "linkHitCount(" + f.Val(row["num"]) + ")";
        Image LinkImg = (Image)e.Item.FindControl("LinkImg");

        LinkA.NavigateUrl = row["url"].ToString();
        LinkA.ToolTip = row["subject"].ToString();
        if (!f.isStrNull(row["target"]))
        {
            LinkA.Target = f.ValString(row["target"]);
            LinkA.ToolTip = f.ValString(row["subject"]) + "(" + _t("另開視窗") + ")";
        }

        if (!f.isStrNull(row["pic1"]))
        {
            LinkImg.ImageUrl = link.Dir + row["pic1"].ToString();
            LinkImg.AlternateText = row["subject"].ToString();
        }
        else
        {
            LinkImg.Visible = false;
            LinkA.Text = row["subject"].ToString();
        }
    }
}


