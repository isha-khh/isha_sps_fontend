using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;

public partial class admin_user_index : ez.admin.PageBase
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

        supervisor.DataQuery queryInfo = new supervisor.DataQuery();
        supervisor supervisor = new supervisor();
        supervisor.initGroup(find3);

        if (!isStrNull(Request["find1"])) {
            queryInfo.u_id = ValString(Request["find1"]); 
            find1.Value = ValString(Request["find1"]);
        }
        if (!isStrNull(Request["find2"])) {
            queryInfo.u_name = ValString(Request["find2"]);
            find2.Value = ValString(Request["find2"]);
        }
        if (!isStrNull(Request["find3"]))
        {
            queryInfo.power = ValString(Request["find3"]);
            find3.SelectedValue = ValString(Request["find3"]);
        }
        if (!isStrNull(Request["find4"]))
        {
            queryInfo.online = (ValString(Request["find4"]) == "1" ? true : false);
            find4.SelectedValue = ValString(Request["find4"]);
        }
        if (!isStrNull(Request["find5"]))
        {
            queryInfo.login_time_min = ValDate(Request["find5"]);
            find5.Value= ValString(Request["find5"]);
        }
        if (!isStrNull(Request["find6"]))
        {
            queryInfo.login_time_max = ValDate(Request["find6"]);
            find6.Value = ValString(Request["find6"]);
        }

        if (!isStrNull(Request["page"])) { queryInfo.NowPage = Val(Request["page"]); }

        supervisor.QuerySource = queryInfo;
        if (supervisor.Query())
        {
            if (supervisor.QuerySource.Total > 0)
            {
                HyperLink1.NavigateUrl = Request.CurrentExecutionFilePath + "?page=1" + ValString(ViewState["query"]);
                HyperLink2.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + supervisor.QuerySource.PrePage.ToString() + ValString(ViewState["query"]);
                HyperLink3.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + supervisor.QuerySource.NextPage.ToString() + ValString(ViewState["query"]);
                HyperLink4.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + supervisor.QuerySource.MaxPage.ToString() + ValString(ViewState["query"]);
                maxpage.Value = supervisor.QuerySource.MaxPage.ToString();
                total.Text = supervisor.QuerySource.Total.ToString();
                for (int i = 1; i <= supervisor.QuerySource.MaxPage; i++)
                {
                    nowpage.Items.Add(i.ToString());
                }
                nowpage.SelectedValue = supervisor.QuerySource.NowPage.ToString();

                Repeater1.DataSource = supervisor.QueryView;
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
            msg.Text = supervisor.log;
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
        DataRowView row = (DataRowView)e.Item.DataItem;
        if (loginInfo.isLoginDesginMode)
        {
            //((CheckBox)e.Item.FindControl("CheckBox1")).Visible = false;
            //((LinkButton)e.Item.FindControl("del")).Visible = false;           
        }
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
        supervisor supervisor = new supervisor();

        int num = Val(((HiddenField)rItem.FindControl("num")).Value);
        if (supervisor.Del(num))
        {
            Response.Redirect(Request.Url.AbsoluteUri);
        }
        else {
            ScriptMsg("刪除失敗");
            Response.Write(supervisor.log);
        }        
    }

    protected void delSelect_Click(object sender, EventArgs e)
    {
        if (Repeater1.Items.Count > 0)
        {
            supervisor supervisor = new supervisor();

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
                if (supervisor.Del(nums.ToArray()))
                {
                   Response.Redirect(Request.Url.AbsoluteUri);
                }
                else
                {
                    ScriptMsg("刪除失敗");
                    Response.Write(supervisor.log);
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