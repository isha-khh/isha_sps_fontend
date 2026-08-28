using ez.data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;

public partial class admin_where_to_use_index : ez.admin.PageBase
{

    public ez.language lan = new ez.language();
    public where_to_use where_to_use = new where_to_use();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            if (lan.Load())
            {
                lan.InitOptions(find1, nationPanel);
                nationTh.Visible = nationPanel.Visible;
                where_to_use.initStatusOptions(find8);
            }

            find2.Items.Clear();
            find2.Items.Add(new ListItem(""));
            where_to_use.initKindOptions(find2);

            list();
        }
    }

    #region 列表

    protected void list()
    {

        string query = ValString(rtnQueryString("page"));
        if (!isStrNull(query)) { query = query.Replace("?", "&"); }
        ViewState["query"] = query;

        where_to_use.DataQuery queryInfo = new where_to_use.DataQuery();


        queryInfo.SelectColumns = "nation,num,subject,kind,use_value,status,reg_time";

        if (!isStrNull(Request["find1"]))
        {
            queryInfo.nation = ValString(Request["find1"]);
            find1.SelectedValue = ValString(Request["find1"]);
        }
        if (!isStrNull(Request["find2"]))
        {
            queryInfo.kind = Val(Request["find2"]);
            find2.SelectedValue = ValString(Request["find2"]);
        }
        if (!isStrNull(Request["find3"]))
        {
            queryInfo.subject = ValString(Request["find3"]);
            find3.Value = ValString(Request["find3"]);
        }
        if (!isStrNull(Request["find8"]))
        {
            queryInfo.status = ValString(Request["find8"]);
            find8.SelectedValue = ValString(Request["find8"]);
        }
        if (!isStrNull(Request["page"])) { queryInfo.NowPage = Val(Request["page"]); }

        where_to_use.QuerySource = queryInfo;
        if (where_to_use.Query())
        {
            if (where_to_use.QuerySource.Total > 0)
            {
                HyperLink1.NavigateUrl = Request.CurrentExecutionFilePath + "?page=1" + ValString(ViewState["query"]);
                HyperLink2.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + where_to_use.QuerySource.PrePage.ToString() + ValString(ViewState["query"]);
                HyperLink3.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + where_to_use.QuerySource.NextPage.ToString() + ValString(ViewState["query"]);
                HyperLink4.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + where_to_use.QuerySource.MaxPage.ToString() + ValString(ViewState["query"]);
                maxpage.Value = where_to_use.QuerySource.MaxPage.ToString();
                total.Text = where_to_use.QuerySource.Total.ToString();
                for (int i = 1; i <= where_to_use.QuerySource.MaxPage; i++)
                {
                    nowpage.Items.Add(i.ToString());
                }
                nowpage.SelectedValue = where_to_use.QuerySource.NowPage.ToString();
                Repeater1.DataSource = where_to_use.QueryView;
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
            msg.Text = where_to_use.log;
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
        if (where_to_use.Del(num))
        {
            Response.Redirect(Request.Url.AbsoluteUri);
        }
        else
        {
            ScriptMsg("刪除失敗");
            Response.Write(where_to_use.log);
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
                if (where_to_use.Del(nums.ToArray()))
                {
                    Response.Redirect(Request.Url.AbsoluteUri);
                }
                else
                {
                    ScriptMsg("刪除失敗");
                    Response.Write(where_to_use.log);
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