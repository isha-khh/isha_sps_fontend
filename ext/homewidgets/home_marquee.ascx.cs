using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class page__uc_index_marquee : ez.web.controls.ControlBase
{

    /*PageSize 參數, 設定讀取的資料筆數 (預設值 6) */
    private int _PageSize = 6;
    public int PageSize { get { return _PageSize; } set { _PageSize = value; } }
    /*ParCategory 參數, 設定取用資料類別 (預設值 "首頁訊息")*/
    private string _ParCategory = "首頁訊息";
    public string ParCategory { get { return _ParCategory; } set { _ParCategory = value; } }
    /*Kind 參數, 設定取用資料分類 (無預設值) */
    private int _Kind = 0;
    public int Kind { get { return _Kind; } set { _Kind = value; } }
    /*Direction 參數, 播放方向 (預設值 left) */
    private string _Direction = "left";
    public string Direction { get { return _Direction; } set { _Direction = value; } }
    /*Speed 參數, 播放速度 (預設值 5000) */
    private int _Speed = 5000;
    public int Speed { get { return _Speed; } set { _Speed = value; } }
    /*HoverPause 參數, 播放速度 (預設值 true) */
    private string _HoverPause = "false";
    public string HoverPause { get { return _HoverPause; } set { _HoverPause = value; } }


    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            TopNews();   //最新消息
        }
    }

    #region 最新消息

    protected void TopNews()
    {
        news news = new news();
        news.DataQuery queryInfo = new news.DataQuery();
        queryInfo.SelectColumns = "nation,num,subject,kind,uptime,link";
        queryInfo.PageSize = _PageSize;
        queryInfo.nation = nation;
        if (_Kind > 0) queryInfo.kind = _Kind;
        queryInfo.category = _ParCategory;
        queryInfo.inTime = true;
        queryInfo.NowPage = 1;
        news.QuerySource = queryInfo;
        if (news.Query())
        {
            NewsRepeater.DataSource = news.QueryView;
            NewsRepeater.DataBind();
        }
    }

    protected void NewsRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        news news = new news();
        DataRowView newsRow = (DataRowView)e.Item.DataItem;
        HyperLink newsItemLink = (HyperLink)e.Item.FindControl("itemLink");
        Literal newsName = (Literal)e.Item.FindControl("subject");
        Literal uptime = (Literal)e.Item.FindControl("uptime");

        newsItemLink.NavigateUrl = "~/page/news/show.aspx?num=" + p.ValString(newsRow["num"]);
        if (!p.isStrNull(newsRow["link"]))
        {
            newsItemLink.NavigateUrl = p.ValString(newsRow["link"]);
            newsItemLink.Target = "_blank";
        }
        newsName.Text = p.cut_str(p.ValString(newsRow["subject"]), 36);
        uptime.Text = p.dateStr(newsRow["uptime"].ToString());
    }
    #endregion
}