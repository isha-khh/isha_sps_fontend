using ez.data;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.OleDb;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Linq;

public partial class admin_store_index : ez.admin.PageBase
{

    public ez.language lan = new ez.language();
    public region region = new region();
    public store.kind store_kind = new store.kind();
    store store = new store();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            if (lan.Load())
            {
                lan.InitOptions(find1, nationPanel);
                nationTh.Visible = nationPanel.Visible;
                store.initStatusOptions(find8);
            }
            initKindOptions();

            list();
        }
    }


    #region 分類/語系

    protected void find1_SelectedIndexChanged(object sender, EventArgs e)
    {
        nation_change();
    }

    protected void nation_change()
    {
        initKindOptions();
    }

    protected void initKindOptions()
    {
        find2.Items.Clear();
        find2.Items.Add("");
        if (!isStrNull(find1.SelectedValue))
        {
            store_kind.InitOptions(find2, find1.SelectedValue);
        }
    }

    #endregion

    #region 列表

    protected void list()
    {

        string query = ValString(rtnQueryString("page"));
        if (!isStrNull(query)) { query = query.Replace("?", "&"); }
        ViewState["query"] = query;

        store.DataQuery queryInfo = new store.DataQuery();


        queryInfo.SelectColumns = "nation,num,pro_num,pro_name,kind,level,areas,postnumber,city,area,address,status";

        if (!isStrNull(Request["find1"]))
        {
            queryInfo.nation = ValString(Request["find1"]);
            find1.SelectedValue = ValString(Request["find1"]);
            nation_change();
        }
        if (!isStrNull(Request["find2"]))
        {
            queryInfo.kind = Val(Request["find2"]);
            find2.SelectedValue = ValString(Request["find2"]);
        }
        if (!isStrNull(Request["find3"]))
        {
            queryInfo.pro_name = ValString(Request["find3"]);
            find3.Value = ValString(Request["find3"]);
        }
        if (!isStrNull(Request["find6"]))
        {
            queryInfo.pro_num = ValString(Request["find6"]);
            find6.Value = ValString(Request["find6"]);
        }
        if (!isStrNull(Request["find8"]))
        {
            queryInfo.status = ValString(Request["find8"]);
            find8.SelectedValue = ValString(Request["find8"]);
        }
        if (!isStrNull(Request["page"])) { queryInfo.NowPage = Val(Request["page"]); }

        store.QuerySource = queryInfo;
        if (store.Query())
        {
            if (store.QuerySource.Total > 0)
            {
                HyperLink1.NavigateUrl = Request.CurrentExecutionFilePath + "?page=1" + ValString(ViewState["query"]);
                HyperLink2.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + store.QuerySource.PrePage.ToString() + ValString(ViewState["query"]);
                HyperLink3.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + store.QuerySource.NextPage.ToString() + ValString(ViewState["query"]);
                HyperLink4.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + store.QuerySource.MaxPage.ToString() + ValString(ViewState["query"]);
                maxpage.Value = store.QuerySource.MaxPage.ToString();
                total.Text = store.QuerySource.Total.ToString();
                for (int i = 1; i <= store.QuerySource.MaxPage; i++)
                {
                    nowpage.Items.Add(i.ToString());
                }
                nowpage.SelectedValue = store.QuerySource.NowPage.ToString();
                Repeater1.DataSource = store.QueryView;
                Repeater1.DataBind();
            }
            else
            {
                noDataPanel.Visible = true;
                pagePanel.Visible = false;
            }
        }
        else
        {
            msg.Text = store.log;
            noDataPanel.Visible = true;
            pagePanel.Visible = false;
        }
    }

    protected void nowpage_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect(Request.CurrentExecutionFilePath + "?page=" + nowpage.SelectedValue + ValString(ViewState["query"]));
    }

    protected void Repeater1_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        ((HtmlTableCell)e.Item.FindControl("nationTd")).Visible = nationPanel.Visible;
        DataRowView row = (DataRowView)e.Item.DataItem;
        ((Literal)e.Item.FindControl("areas")).Text =
        !isStrNull(row["areas"]) ? region.getText(ValString(row["areas"]).Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Select(n => Val(n)).ToArray()) : "";
    }

    #endregion

    #region 搜尋

    protected void searchButton_Click(object sender, EventArgs e)
    {
        string query = searchQuery(searchPanel);
        Response.Redirect(Request.Url.AbsolutePath + "?page=1" + query);
    }

    #endregion

    #region 刪除

    protected void del_Click(object sender, EventArgs e)
    {
        RepeaterItem rItem = (RepeaterItem)((LinkButton)sender).NamingContainer;

        int num = Val(((HiddenField)rItem.FindControl("num")).Value);
        if (store.Del(num))
        {
            Response.Redirect(Request.Url.AbsoluteUri);
        }
        else
        {
            ScriptMsg("刪除失敗");
            Response.Write(store.log);
        }
    }

    protected void delSelect_Click(object sender, EventArgs e)
    {
        if (Repeater1.Items.Count > 0)
        {

            List<int> nums = new List<int>();
            for (int i = 0; i < Repeater1.Items.Count; i++)
            {
                RepeaterItem rItem = Repeater1.Items[i];
                if (((CheckBox)rItem.FindControl("CheckBox1")).Checked)
                {
                    nums.Add(Val(((HiddenField)rItem.FindControl("num")).Value));
                }
            }
            if (nums.Count > 0)
            {
                if (store.Del(nums.ToArray()))
                {
                    Response.Redirect(Request.Url.AbsoluteUri);
                }
                else
                {
                    ScriptMsg("刪除失敗");
                    Response.Write(store.log);
                }
            }
            else
            {
                ScriptMsg("請勾選要刪除的項目");
            }

        }
    }

    #endregion

}