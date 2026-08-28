using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class cat_faq : ez.web.controls.ControlBase 
{
    public ArrayList kindTree = new ArrayList();
    public QA.kind QAKind = new QA.kind();
    public bool isExpand = false;

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            info WebSet = new info();
            WebSet.Load();
            isExpand = WebSet.Data.kind_expand;

            if (Request.Url.AbsolutePath.IndexOf("/faq/") > -1 && !f.isStrNull(Request["kind"]))
            {
                //取得分類階層
                kindTree = QAKind.KindTree(f.Val(Request["kind"]));
            }

            Repeater1.DataSource = QAKind.RowDataTable(0, nation);
            Repeater1.DataBind();

            try
            {
                ((QAKindToBasePage)this.Page).kindInfoGet(kindTree);  //將分類結構傳給頁面
            }
            catch (Exception)
            {

            }

        }
    }

    protected void Repeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        if (e.Item.ItemType != ListItemType.Footer && e.Item.ItemType != ListItemType.Header && e.Item.ItemType != ListItemType.Separator)
        {
            DataRowView row = (DataRowView)e.Item.DataItem;
            Repeater Rpt = (Repeater)sender;
            int v = f.Val(Rpt.ID.Substring(Rpt.ID.Length - 1, 1));
            if (v <= kindTree.Count)
            {
                QA.kind.KindInfo kindfInfo = (QA.kind.KindInfo)kindTree[v - 1];
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
        rpt.DataSource = QAKind.RowDataTable(f.Val(row["num"]), nation);
        rpt.DataBind();
    }
}