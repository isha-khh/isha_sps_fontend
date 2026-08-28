using ez.data;
using System;
using System.Collections;
using System.Data;
using System.Web.UI.WebControls;


public partial class cat_recycle : ez.web.controls.ControlBase
{
    public ArrayList kindTree = new ArrayList();
    public recycle.kind recycleKind = new recycle.kind();
    public bool isExpand = false;

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            info WebSet = new info();
            WebSet.Load();
            isExpand = WebSet.Data.kind_expand;

            if (Request.Url.AbsolutePath.IndexOf("/recycle/") > -1 && !f.isStrNull(Request["kind"]))
            {
                //取得分類階層
                kindTree = recycleKind.KindTree(f.Val(Request["kind"]));
            }

            Literal1.Text = _t("回收物查詢");
            int root = 0;
            if (Request.Url.AbsolutePath.IndexOf("/recycle/") > -1 && !f.isStrNull(Request["root"]) && f.IsNumeric(Request["root"]))
            {
                root = f.Val(Request["root"]);
                recycle.kind recycle_kind = new recycle.kind();
                if (recycle_kind.Load(root))
                {
                    Literal1.Text = recycle_kind.Data.kind;
                }
            }

            Repeater1.DataSource = recycleKind.RowDataTable(root, nation);
            Repeater1.DataBind();

            try
            {
                ((RecycleKindToBasePage)this.Page).kindInfoGet(kindTree);  //將分類結構傳給頁面
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
                recycle.kind.KindInfo kindfInfo = (recycle.kind.KindInfo)kindTree[v - 1];
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
        rpt.DataSource = recycleKind.RowDataTable(f.Val(row["num"]), nation);
        rpt.DataBind();
    }

}