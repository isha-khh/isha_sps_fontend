using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class ext_submenu_sub_faq_sub_faq : ez.web.controls.SubNavControl
{
    album.kind albumKind = new album.kind();
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            ViewState["dropdown_submenu"] = "";
            ViewState["SubPage"] = "~/page/album/index.aspx";
           
            int Selroot = 0;
            if (f.IsNumeric(this.sub_menu_para))
            {
                Selroot = f.Val(this.sub_menu_para);
            }
            Repeater2.DataSource = albumKind.RowDataTable(Selroot, nation);
            Repeater2.DataBind();
        }
    }
    protected void Repeater2_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        if (e.Item.ItemType != ListItemType.Header && e.Item.ItemType != ListItemType.Footer)
        {
            DataRowView row = (DataRowView)e.Item.DataItem;
            HyperLink menu = (HyperLink)e.Item.FindControl("menu");

            //宣告有無第二層BOOLEAN  submenuControl
            if (Tiers > 2)
            {
                Repeater Repeater3 = (Repeater)e.Item.FindControl("Repeater3");
                ViewState["SubPage2"] = "~/page/album/index.aspx";
                DataTable dt = albumKind.RowDataTable(f.Val(row["num"]), nation);
                if (dt.Rows.Count > 0)
                {
                    Repeater3.DataSource = dt;//固定主分類
                    Repeater3.DataBind();
                    menu.CssClass = "trigger";
                }
            }

            menu.NavigateUrl = ViewState["SubPage"].ToString() + "?kind=" + row["num"].ToString();
            menu.Text = row["kind"].ToString();
        }
    }
    protected void Repeater3_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        if (e.Item.ItemType != ListItemType.Header && e.Item.ItemType != ListItemType.Footer)
        {
            DataRowView row = (DataRowView)e.Item.DataItem;
            HyperLink menu = (HyperLink)e.Item.FindControl("menu");
            menu.NavigateUrl = ViewState["SubPage2"].ToString() + "?kind=" + row["num"].ToString();
            menu.Text = row["kind"].ToString();
        }
    }


}