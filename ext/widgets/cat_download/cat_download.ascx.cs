using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;


public partial class cat_download : ez.web.controls.ControlBase
{

    public ArrayList kindTree = new ArrayList();
    public download.kind downloadKind = new download.kind();
    public bool isExpand = false;

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            info WebSet = new info();
            WebSet.Load();
            isExpand = WebSet.Data.kind_expand;

            if (Request.Url.AbsolutePath.IndexOf("/download/") > -1 && !f.isStrNull(Request["kind"]))
            {
                //取得分類階層
                kindTree = downloadKind.KindTree(f.Val(Request["kind"]));
            }

            Literal1.Text = _t("檔案下載");
            int root = 0;
            if (Request.Url.AbsolutePath.IndexOf("/download/") > -1 && !f.isStrNull(Request["root"]) && f.IsNumeric(Request["root"]))
            {
                root = f.Val(Request["root"]);
                download.kind download_kind = new download.kind();
                if (download_kind.Load(root))
                {
                    Literal1.Text = download_kind.Data.kind;
                }
            }

            Repeater1.DataSource = downloadKind.RowDataTable(root, nation);
            Repeater1.DataBind();

            try
            {
                ((downloadKindToBasePage)this.Page).kindInfoGet(kindTree);  //將分類結構傳給頁面
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
                download.kind.KindInfo kindfInfo = (download.kind.KindInfo)kindTree[v - 1];
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
        rpt.DataSource = downloadKind.RowDataTable(f.Val(row["num"]), nation);
        rpt.DataBind();
    }
}