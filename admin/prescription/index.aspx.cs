using ez.data;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.OleDb;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Linq;

public partial class admin_prescription_index : ez.admin.PageBase
{

    public ez.language lan = new ez.language();
    public region region = new region();
    prescription prescription = new prescription();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            if (lan.Load())
            {
                lan.InitOptions(find1, nationPanel);
                nationTh.Visible = nationPanel.Visible;
                prescription.initStatusOptions(find8);
            }

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
      
    }

    #endregion

    #region 列表

    protected void list()
    {

        string query = ValString(rtnQueryString("page"));
        if (!isStrNull(query)) { query = query.Replace("?", "&"); }
        ViewState["query"] = query;

        prescription.DataQuery queryInfo = new prescription.DataQuery();


        queryInfo.SelectColumns = "nation,num,pro_name,reg_time,status";

        if (!isStrNull(Request["find1"]))
        {
            queryInfo.nation = ValString(Request["find1"]);
            find1.SelectedValue = ValString(Request["find1"]);
            nation_change();
        }
        if (!isStrNull(Request["find3"]))
        {
            queryInfo.pro_name = ValString(Request["find3"]);
            find3.Value = ValString(Request["find3"]);
        }
        if (!isStrNull(Request["find8"]))
        {
            queryInfo.status = ValString(Request["find8"]);
            find8.SelectedValue = ValString(Request["find8"]);
        }
        if (!isStrNull(Request["page"])) { queryInfo.NowPage = Val(Request["page"]); }

        prescription.QuerySource = queryInfo;
        if (prescription.Query())
        {
            if (prescription.QuerySource.Total > 0)
            {
                HyperLink1.NavigateUrl = Request.CurrentExecutionFilePath + "?page=1" + ValString(ViewState["query"]);
                HyperLink2.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + prescription.QuerySource.PrePage.ToString() + ValString(ViewState["query"]);
                HyperLink3.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + prescription.QuerySource.NextPage.ToString() + ValString(ViewState["query"]);
                HyperLink4.NavigateUrl = Request.CurrentExecutionFilePath + "?page=" + prescription.QuerySource.MaxPage.ToString() + ValString(ViewState["query"]);
                maxpage.Value = prescription.QuerySource.MaxPage.ToString();
                total.Text = prescription.QuerySource.Total.ToString();
                for (int i = 1; i <= prescription.QuerySource.MaxPage; i++)
                {
                    nowpage.Items.Add(i.ToString());
                }
                nowpage.SelectedValue = prescription.QuerySource.NowPage.ToString();
                Repeater1.DataSource = prescription.QueryView;
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
            msg.Text = prescription.log;
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
        if (prescription.Del(num))
        {
            Response.Redirect(Request.Url.AbsoluteUri);
        }
        else
        {
            ScriptMsg("刪除失敗");
            Response.Write(prescription.log);
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
                if (prescription.Del(nums.ToArray()))
                {
                    Response.Redirect(Request.Url.AbsoluteUri);
                }
                else
                {
                    ScriptMsg("刪除失敗");
                    Response.Write(prescription.log);
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