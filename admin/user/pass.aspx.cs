using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;

public partial class admin_user_pass : ez.admin.PageBase
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
        queryInfo.SelectColumns = "num,u_id,u_name,u_password,online";
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

    public string GetItemName(string values, DropDownList obj)
    {
        List<string> text = new List<string>();
        string[] value = values.Split(',');
        foreach (string val in value)
            if (val.Trim() != "")
                foreach (ListItem item in obj.Items)
                    if (item.Value == val.Trim())
                    {
                        text.Add(item.Text); break;
                    }
        return "<div style=\"white-space:nowrap; display:inline-block\">" + string.Join("</div><div>", text) + "</div>";
    }

    #endregion

    #region 搜尋

    protected void searchButton_Click(object sender, EventArgs e)
    {
        string query = searchQuery(searchPanel);
        Response.Redirect(Request.Url.AbsolutePath + "?page=1" + query);
    }

    #endregion

}