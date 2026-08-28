using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;

public partial class admin_user_system_log : ez.admin.PageBase
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            InitEnumsOptions<SystemLog.Status>(find4);
            list();
        }
    }

    #region 列表

    protected void list()
    {

        string query = ValString(rtnQueryString("page"));
        if (!isStrNull(query)) { query = query.Replace("?", "&"); }
        ViewState["query"] = query;

        SystemLog systemLog = new SystemLog();
        SystemLog.DataQuery queryInfo = new SystemLog.DataQuery();

        if (!isStrNull(Request["find1"])) {
            queryInfo.u_id = ValString(Request["find1"]); 
            find1.Value = ValString(Request["find1"]);
        }
        if (!isStrNull(Request["find2"])) {
            queryInfo.login_ip = ValString(Request["find2"]);
            find2.Value = ValString(Request["find2"]);
        }
        if (!isStrNull(Request["find3"]))
        {
            queryInfo.word = ValString(Request["find3"]);
            find3.Value = ValString(Request["find3"]);
        }
        if (!isStrNull(Request["find4"]))
        {
            queryInfo.status = (SystemLog.Status)Val(Request["find4"]);
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

        systemLog.QuerySource = queryInfo;
        if (systemLog.Query())
        {
            if (systemLog.QuerySource.Total > 0)
            {
                HyperLink1.NavigateUrl = Request.CurrentExecutionFilePath + "?page=1" + ValString(ViewState["query"]);
                HyperLink2.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + systemLog.QuerySource.PrePage.ToString() + ValString(ViewState["query"]);
                HyperLink3.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + systemLog.QuerySource.NextPage.ToString() + ValString(ViewState["query"]);
                HyperLink4.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + systemLog.QuerySource.MaxPage.ToString() + ValString(ViewState["query"]);
                maxpage.Value = systemLog.QuerySource.MaxPage.ToString();
                total.Text = systemLog.QuerySource.Total.ToString();
                for (int i = 1; i <= systemLog.QuerySource.MaxPage; i++)
                {
                    nowpage.Items.Add(i.ToString());
                }
                nowpage.SelectedValue = systemLog.QuerySource.NowPage.ToString();

                Repeater1.DataSource = systemLog.QueryView;
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
            msg.Text = systemLog.log;
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
        SystemLog.Status myStatus = (SystemLog.Status)Val(row["status"]);
        Label status = (Label)e.Item.FindControl("status");
        status.Text = GetEnumsDescription(myStatus);
        switch (myStatus)
        {
            case SystemLog.Status.Add:
                status.ForeColor = System.Drawing.Color.Green;
                status.Text = "<i class=\"fas fa-check-circle\"></i> " + status.Text;
                break;
            case SystemLog.Status.Edit:
                status.ForeColor = System.Drawing.Color.Blue;
                status.Text = "<i class=\"fas fa-exclamation-circle\"></i> " + status.Text;
                break;
            case SystemLog.Status.Del:
                status.ForeColor = System.Drawing.Color.Red;
                status.Text = "<i class=\"fas fa-times-circle\"></i> " + status.Text;
                break;
            case SystemLog.Status.Login:
                status.ForeColor = System.Drawing.Color.Green;
                status.Text = "<i class=\"fas fa-user-circle\"></i> " + status.Text;
                break;
            case SystemLog.Status.ChangePassword:
                status.ForeColor = System.Drawing.Color.Green;
                status.Text = "<i class=\"fas fa-pencil\"></i> " + status.Text;
                break;
            default:
                status.ForeColor = System.Drawing.Color.OrangeRed;
                status.Text = "<i class=\"fas fa-info-circle\"></i> " + status.Text;
                break;
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

    
    
}