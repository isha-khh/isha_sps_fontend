using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;
//客制一個事件參數

public partial class ext_submenu_sub_page_sub_page : ez.web.controls.SubNavControl
{
    pages pages = new pages();
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            string liClassN = "";
            int Selroot = 0;
            ViewState["dropdown_submenu"] = "";
            
            ViewState["SubPage"] = "~/page/about/index.aspx";

            if (!f.isStrNull(this.liClassName))
            {
                liClassN = f.ValString(this.liClassName);
            }
            if (f.IsNumeric(this.sub_menu_para))
            {
              Selroot=f.Val(this.sub_menu_para);
            }
            Repeater2.DataSource = pages.RowDataTable(Selroot, nation);//row[8]為kind傳入
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
                ViewState["SubPage2"] = "~/page/about/index.aspx";
                DataTable dt = pages.RowDataTable(f.Val(row["num"]), nation);

                if (dt.Rows.Count > 0)
                {
                    Repeater3.DataSource = dt;//固定主分類
                    Repeater3.DataBind();
                    //menu.CssClass = "trigger";
                    menu.CssClass = "dropdown-item dropdown-toggle";
                    //menu.Attributes.Add("data-bs-toggle", "dropdown");
                }
            }
                menu.NavigateUrl = ViewState["SubPage"].ToString() + "?kind=" + row["num"].ToString();
                menu.Text = row["kind"].ToString();

            if (!f.isStrNull(row["link"]))
            {
                menu.NavigateUrl = f.ValString(row["link"]);
                menu.Target = "_blank";

            }
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
            if (!f.isStrNull(row["link"]))
            {
                menu.NavigateUrl = f.ValString(row["link"]);
                menu.Target = "_blank";

            }
        }
    }
}