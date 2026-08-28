using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class admin_user_group_show : ez.admin.PageBase
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            list();
        }
    }

    #region 列表

    protected void list()
    {

        string query = ValString(rtnQueryString("page"));
        if (!isStrNull(query)) { query = query.Replace("?", "&"); }
        ViewState["query"] = query;

        group.DataQuery queryInfo = new group.DataQuery();
        group group = new group();       
        if (!isStrNull(Request["find1"])) {
            queryInfo.g_name = ValString(Request["find1"]); 
            find1.Value = ValString(Request["find1"]);
        }
        if (!isStrNull(Request["find2"])) {
            queryInfo.demo = ValString(Request["find2"]);
            find2.Value = ValString(Request["find2"]);
        }

        if (!isStrNull(Request["page"])) { queryInfo.NowPage = Val(Request["page"]); }

        group.QuerySource = queryInfo;
        if (group.Query())
        {
            if (group.QuerySource.Total > 0)
            {
                HyperLink1.NavigateUrl = Request.CurrentExecutionFilePath + "?page=1" + ValString(ViewState["query"]);
                HyperLink2.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + group.QuerySource.PrePage.ToString() + ValString(ViewState["query"]);
                HyperLink3.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + group.QuerySource.NextPage.ToString() + ValString(ViewState["query"]);
                HyperLink4.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + group.QuerySource.MaxPage.ToString() + ValString(ViewState["query"]);
                maxpage.Value = group.QuerySource.MaxPage.ToString();
                total.Text = group.QuerySource.Total.ToString();
                for (int i = 1; i <= group.QuerySource.MaxPage; i++)
                {
                    nowpage.Items.Add(i.ToString());
                }
                nowpage.SelectedValue = group.QuerySource.NowPage.ToString();

                Repeater1.DataSource = group.QueryView;
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
            msg.Text = group.log;
            noDataPanel.Visible = true;
            pagePanel.Visible = false;
        }
    }

    protected void nowpage_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect(Request.CurrentExecutionFilePath + "?page=" + nowpage.SelectedValue + ValString(ViewState["query"]));
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
        group group = new group();

        int num = Val(((HiddenField)rItem.FindControl("num")).Value);
        if (group.Del(num))
        {
            Response.Redirect(Request.Url.AbsoluteUri);
        }
        else {
            ScriptMsg("刪除失敗");
            Response.Write(group.log);
        }        
    }

    protected void delSelect_Click(object sender, EventArgs e)
    {
        if (Repeater1.Items.Count > 0)
        {
            group group = new group();

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
                if (group.Del(nums.ToArray()))
                {
                   Response.Redirect(Request.Url.AbsoluteUri);
                }
                else
                {
                    ScriptMsg("刪除失敗");
                    Response.Write(group.log);
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