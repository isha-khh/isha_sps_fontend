using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class cat_about : ez.web.controls.ControlBase
{

    public ArrayList kindTree = new ArrayList();
    public pages pages = new pages();
    public bool isExpand = false;

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            info WebSet = new info();
            WebSet.Load();
            isExpand = WebSet.Data.kind_expand;

            if (Request.Url.AbsolutePath.IndexOf("/about/") > -1 && !f.isStrNull(Request["kind"]))
            {
                //取得分類階層
                kindTree = pages.KindTree(f.Val(Request["kind"]));
            }

            if (kindTree.Count > 0)
            {

                try
                {
                    ((PagesToBasePage)this.Page).PagesInfoGet(kindTree);  //將分類結構傳給頁面
                }
                catch (Exception)
                {

                }

                pages.KindInfo KindInfo = (pages.KindInfo)kindTree[0];

                menu menu = new menu();
                if (menu.LoadPage(KindInfo.num))
                {
                    Literal1.Text = "<span class=\"txt-tw\">" + menu.Data.kind + "</span>";
                    if (!f.isStrNull(menu.Data.kind2))
                    {
                        Literal1.Text = "<span class=\"txt-en\">" + menu.Data.kind2 + "</span>" + Literal1.Text;
                    }

                }else
                {
                    Literal1.Text = pages.rootText(KindInfo.num);
                }

                
                


                kindTree.Remove(kindTree[0]);

                Repeater1.DataSource = pages.RowDataTable(KindInfo.num, nation);
                Repeater1.DataBind();

                try
                {
                    ((ProductKindToBasePage)this.Page).kindInfoGet(kindTree);  //將分類結構傳給頁面
                }
                catch (Exception)
                {

                }

            }

        }
    }

    protected void Repeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        if (e.Item.ItemType != ListItemType.Footer && e.Item.ItemType != ListItemType.Header && e.Item.ItemType != ListItemType.Separator)
        {
            DataRowView row = (DataRowView)e.Item.DataItem;
            HyperLink about = (HyperLink)e.Item.FindControl("about");
            about.Text = f.ValString(row["kind"]);
            about.NavigateUrl = u.WebRoot() + "page/about/index.aspx?kind=" + f.ValString(row["num"]);
            if (!f.isStrNull(row["link"]))
            {
                about.NavigateUrl = f.ValString(row["link"]);
                about.Target = "_blank";

            }
            Repeater Rpt = (Repeater)sender;
            int v = f.Val(Rpt.ID.Substring(Rpt.ID.Length - 1, 1));
            if (v <= kindTree.Count)
            {
                pages.KindInfo kindfInfo = (pages.KindInfo)kindTree[v - 1];
                if (row["num"].ToString() == kindfInfo.num.ToString())
                {
                    ExpandRepeater(v, row, e);
                }
            }
            else if (isExpand)
            {
                ExpandRepeater(v, row, e);
            }
        }
    }

    protected void ExpandRepeater(int v, DataRowView row, RepeaterItemEventArgs e)
    {
        Repeater rpt = (Repeater)e.Item.FindControl("Repeater" + (v + 1).ToString());
        rpt.DataSource = pages.RowDataTable(f.Val(row["num"]), nation);
        rpt.DataBind();
    }
   
}