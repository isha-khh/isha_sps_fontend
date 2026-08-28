using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;

public partial class admin_user_log : ez.admin.PageBase
{
    public string ItemListVlue1;
    private const int chartMaxDay = 30;   //圖表最多只統計30天內的
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            InitEnumsOptions<LoginHistory.Status>(find4);
            list();
            chartlist();
        }
    }

    #region 列表
    protected void chartlist()
    {
        ItemListVlue1 = "";
        if (!isStrNull(Request["find5"]))
        {

            DateTime dtStart = ValDate(Request["find5"]);
            DateTime dtEnd = !isStrNull(Request["find6"]) && ValDate(Request["find6"]).Date <= dtStart.AddDays(chartMaxDay).Date ? ValDate(Request["find6"]) : dtStart.AddDays(chartMaxDay);

            PlaceHolder1.Visible = true;

            LoginHistory loginHistory = new LoginHistory();
            LoginHistory.DataQuery queryInfo = new LoginHistory.DataQuery();
            if (!isStrNull(Request["find1"]))
            {
                queryInfo.u_id = ValString(Request["find1"]);
            }
            if (!isStrNull(Request["find2"]))
            {
                queryInfo.login_ip = ValString(Request["find2"]);
            }
            if (!isStrNull(Request["find4"]))
            {
                queryInfo.status = (LoginHistory.Status)Val(Request["find4"]);
            }
            if (!isStrNull(Request["find5"]))
            {
                queryInfo.login_time_min = dtStart;
            }
            if (!isStrNull(Request["find6"]))
            {
                queryInfo.login_time_max = dtEnd;
            }
            
            queryInfo.NowPage = 1;
            queryInfo.PageSize = 99999999;
            loginHistory.QuerySource = queryInfo;
          
            if (loginHistory.Query())
            {
                if (loginHistory.QuerySource.Total > 0)
                {               
                    bool onInit = true;
                    while (onInit)
                    {
                        var _target = dtStart.Subtract(new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
                        var FilterQ = from f in loginHistory.QueryView.AsEnumerable()
                                      where ValDate(f.Field<DateTime>("login_time")).Date == ValDate(dtStart).Date
                                      group f by new { t1 = ValDate(f.Field<DateTime?>("login_time")).Date } into m
                                      select new
                                      {
                                          qty = m.Count(),
                                      };
                        if (FilterQ.Count() > 0)
                        {
                            foreach (var item in FilterQ)
                            {
                                ItemListVlue1 += "{x:new Date(" + _target + "), y:" + Val(item.qty) + ", indexLabel: \"" + Val(item.qty) + "\", indexLabelFontColor: \"#000000\"},\n";
                            }
                        }
                        else
                        {
                            ItemListVlue1 += "{x:new Date(" + _target + "), y: 0, indexLabel: \"0\", indexLabelFontColor: \"#000000\"},\n";
                        }
                        if (dtStart.Date== dtEnd.Date) { onInit = false; }
                        dtStart = dtStart.AddDays(1);
                    }
               
                }
            
              } 
        }

    }
    protected void list()
    {

        string query = ValString(rtnQueryString("page"));
        if (!isStrNull(query)) { query = query.Replace("?", "&"); }
        ViewState["query"] = query;

        LoginHistory loginHistory = new LoginHistory();
        LoginHistory.DataQuery queryInfo = new LoginHistory.DataQuery();

        if (!isStrNull(Request["find1"])) {
            queryInfo.u_id = ValString(Request["find1"]); 
            find1.Value = ValString(Request["find1"]);
        }
        if (!isStrNull(Request["find2"])) {
            queryInfo.login_ip = ValString(Request["find2"]);
            find2.Value = ValString(Request["find2"]);
        }
        if (!isStrNull(Request["find4"]))
        {
            queryInfo.status = (LoginHistory.Status)Val(Request["find4"]);
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

        loginHistory.QuerySource = queryInfo;
        if (loginHistory.Query())
        {
            if (loginHistory.QuerySource.Total > 0)
            {
                HyperLink1.NavigateUrl = Request.CurrentExecutionFilePath + "?page=1" + ValString(ViewState["query"]);
                HyperLink2.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + loginHistory.QuerySource.PrePage.ToString() + ValString(ViewState["query"]);
                HyperLink3.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + loginHistory.QuerySource.NextPage.ToString() + ValString(ViewState["query"]);
                HyperLink4.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + loginHistory.QuerySource.MaxPage.ToString() + ValString(ViewState["query"]);
                maxpage.Value = loginHistory.QuerySource.MaxPage.ToString();
                total.Text = loginHistory.QuerySource.Total.ToString();
                for (int i = 1; i <= loginHistory.QuerySource.MaxPage; i++)
                {
                    nowpage.Items.Add(i.ToString());
                }
                nowpage.SelectedValue = loginHistory.QuerySource.NowPage.ToString();
                
               if (!isStrNull(Request["find5"]) && !isStrNull(Request["find6"]))
                {
                    ItemListVlue1 = ""; PlaceHolder1.Visible = true;
                   DateTime dtStart = ValDate(Request["find5"]);
                    DateTime dtEnd = ValDate(Request["find6"]);
                    TimeSpan ts = (dtEnd - dtStart);
                    int iMonths = dtEnd.Year * 12 + dtEnd.Month - (dtStart.Year * 12 + dtStart.Month);

                    TimeSpan s = new TimeSpan(dtEnd.Ticks - dtStart.Ticks);
                    iMonths = (s.Days);

                    for (int j = 0; j <= iMonths; j++)
                    {
                        var _target = dtStart.Subtract(new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
                        var FilterQ = from f in loginHistory.QueryView.AsEnumerable()
                                      where ValDate(f.Field<DateTime>("login_time")).Date == ValDate(dtStart).Date
                                      group f by new { t1 = ValDate(f.Field<DateTime?>("login_time")).Date } into m
                                      select new
                                      {
                                          qty = m.Count(),
                                      };
                        if (FilterQ.Count() > 0)
                        {
                            foreach (var item in FilterQ)
                            {
                                ItemListVlue1 += "{x:new Date(" + _target + "), y:" + Val(item.qty) + ", indexLabel: \""+ Val(item.qty) + "\", indexLabelFontColor: \"\"},\n";
                            }
                        }
                        else
                        {
                            ItemListVlue1 += "{x:new Date(" + _target + "), y: 0, indexLabel: \"\", indexLabelFontColor: \"\"},\n";
                        }

                        dtStart = dtStart.AddDays(1);
                    }

                }
                   

                Repeater1.DataSource = loginHistory.QueryView;
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
            msg.Text = loginHistory.log;
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
        LoginHistory.Status myStatus = (LoginHistory.Status)Val(row["status"]);
        Label status = (Label)e.Item.FindControl("status");
        status.Text = GetEnumsDescription(myStatus);
        switch (myStatus)
        {
            case LoginHistory.Status.Success:
                status.ForeColor = System.Drawing.Color.Green;
                status.Text = "<i class=\"fas fa-check-circle\"></i> " + status.Text;
                break;
            //case LoginHistory.Status.Disable:
            //    break;
            //case LoginHistory.Status.Expire:
            //    break;
            //case LoginHistory.Status.Incorrect:
            //    break;
            case LoginHistory.Status.GroupNotExist:
                status.ForeColor = System.Drawing.Color.Red;
                status.Text = "<i class=\"fas fa-times-circle\"></i> " + status.Text;
                break;
            case LoginHistory.Status.PermissionsNotSet:
                status.ForeColor = System.Drawing.Color.Red;
                status.Text = "<i class=\"fas fa-times-circle\"></i> " + status.Text;
                break;
            default:
                status.ForeColor = System.Drawing.Color.OrangeRed;
                status.Text = "<i class=\"fas fa-exclamation-circle\"></i> " + status.Text;
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