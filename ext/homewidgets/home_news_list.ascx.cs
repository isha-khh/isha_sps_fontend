using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class home_recent_news : ez.web.controls.ControlBase
{
    /*PageSize 參數, 設定讀取的資料筆數 (預設值 6) */
    private int _PageSize = 5;
    public int PageSize { get { return _PageSize; } set { _PageSize = value; } }
    /*colClass 參數, 設定col數 (預設值 "col-sm-4")*/
    private string _colClass = "col-sm-4";
    public string colClass { get { return _colClass; } set { _colClass = value; } }
    /*ParCategory 參數, 設定取用資料類別 (預設值 "首頁訊息")*/
    private string _ParCategory = "首頁訊息";
    public string ParCategory { get { return _ParCategory; } set { _ParCategory = value; } }
    /*Kind 參數, 設定取用某分類的資料 (無預設值) */
    private int _Kind = 0;
    public int Kind { get { return _Kind; } set { _Kind = value; } }
    /*showKind 參數, 設定是否顯示分類名稱 (false) */
    private bool _showKind = false;
    public bool showKind { get { return _showKind; } set { _showKind = value; } }
    /*Root 參數, 限制連結後顯示的主分類 (無預設值) */
    private int _Root = 0;
    public int Root { get { return _Root; } set { _Root = value; } }
    /*BlockTitle 參數, 設定區塊標題 (預設值 "最新消息") */
    private string _BlockTitle = "最新消息";
    public string BlockTitle { get { return _BlockTitle; } set { _BlockTitle = value; } }
    /*picWidth 參數, 設定圖片的寬 (預設值 "640") */
    private string _picWidth = "640";
    public string picWidth { get { return _picWidth; } set { _picWidth = value; } }
    /*picHeight 參數, 設定圖片的高 (預設值 "480") */
    private string _picHeight = "480";
    public string picHeight { get { return _picHeight; } set { _picHeight = value; } }
    /*picNoImg 參數, 當沒有圖片時用的圖，如果圖片路徑為upload/noimg.jpg，那請設為noimg.jpg即可 (預設值 "../App_Script/noimage_us.jpg") */
    private string _picNoImg = "../App_Script/noimage_us.jpg";
    public string picNoImg { get { return _picNoImg; } set { _picNoImg = value; } }
    /*descTextMax 參數, 設定簡介文字最大長度 (預設值 70) */
    private int _descTextMax = 70;
    public int descTextMax { get { return _descTextMax; } set { _descTextMax = value; } }

    /*autoPlay 參數, 設定轉盤是否自動播放 (預設值 "true" ) */
    private string _autoPlay = "true";
    public string autoPlay { get { return _autoPlay; } set { _autoPlay = value; } }
    /*showCol 參數, 設定轉盤顯示個數 (預設值 "4,3,2,1,1" ) */
    private string _slidesCol = "4,3,2,1,1";
    public string slidesCol { get { return _slidesCol; } set { _slidesCol = value; } }
    public string[] slidesToShow = { "4", "3", "2", "1", "1" };


    news news = new news();
    news.kind newsKind = new news.kind();

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            //處理轉盤顯示個數
            string[] slidesColA = _slidesCol.Split(',');
            if (slidesColA.Length == 1)
            {
                for (int i = 0; i < slidesToShow.Length; i++)
                {
                    slidesToShow[i] = slidesColA[0];
                }
            }
            else
            {
                for (int i = 0; i < slidesColA.Length; i++)
                {
                    slidesToShow[i] = slidesColA[i];
                }
            }

            TopNews();

            btnMore.Text = _t("查看更多");
            string addLinkPara = (_Kind > 0) ? "?kind=" + _Kind : "";
            if (!p.isStrNull(addLinkPara))
            {
                addLinkPara = (Root > 0) ? addLinkPara + "&root=" + Root : addLinkPara;
            }
            else
            {
                addLinkPara = (Root > 0) ? "?root=" + Root : "";
            }
            btnMore.NavigateUrl = "~/page/news/index.aspx" + addLinkPara;

        }
    }
    #region 最新消息

    protected void TopNews()
    {
        news.DataQuery queryInfo = new news.DataQuery();
        queryInfo.SelectColumns = "nation,num,subject,kind,uptime,link,pic1,topping,movie";
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
        DataRowView newsRow = (DataRowView)e.Item.DataItem;
        HyperLink knidLink = (HyperLink)e.Item.FindControl("knidLink");
        HyperLink itemLink = (HyperLink)e.Item.FindControl("itemLink");
        HyperLink picWrap = (HyperLink)e.Item.FindControl("picWrap");
        Literal title = (Literal)e.Item.FindControl("subject");
        Literal uptime = (Literal)e.Item.FindControl("uptime");
        Literal description = (Literal)e.Item.FindControl("description");
        Image pic = (Image)e.Item.FindControl("pic");
        Literal movie = (Literal)e.Item.FindControl("movie");

        if (_showKind)
        {
            knidLink.NavigateUrl = "~/page/news/index.aspx?kind=" + p.Val(newsRow["kind"]);
            knidLink.Text = newsKind.kindText(p.Val(newsRow["kind"]), false);
            knidLink.Visible = _showKind;
        }

        string addLinkPara = (_Kind > 0) ? "&kind=" + _Kind : "&kind=" + p.ValString(newsRow["kind"]);
        addLinkPara = (Root > 0) ? addLinkPara + "&root=" + Root : addLinkPara;
        itemLink.NavigateUrl = "~/page/news/show.aspx?num=" + p.ValString(newsRow["num"]) + addLinkPara;
        if (!p.isStrNull(newsRow["link"]))
        {
            itemLink.NavigateUrl = p.ValString(newsRow["link"]);
            picWrap.Target = itemLink.Target = "_blank";
        }

        picWrap.NavigateUrl = itemLink.NavigateUrl;
        if (!f.isStrNull(newsRow["movie"]))
        {
            pic.Visible = false;
            movie.Text = f.Getyoutube(f.ValString(newsRow["movie"]));
        }
        else
        {
            pic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + _picHeight + "&w=" + _picWidth + "&h=" + _picHeight;
            if (!p.isStrNull(newsRow["pic1"]))
            {
                string rootDir = news.Dir.Replace("~/", "");
                string[] pics = newsRow["pic1"].ToString().Split(',');
                foreach (string picFile in pics)
                {
                    if (!p.isStrNull(picFile))
                    {
                        pic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + picFile + "&rootDir=" + rootDir + "&w=" + _picWidth + "&h=" + _picHeight;
                        break;
                    }
                }
            }
        }

        title.Text = p.cut_str(p.ValString(newsRow["subject"]), 36);
        uptime.Text = p.dateStr(newsRow["uptime"].ToString());

        seo newsSeo = new seo(news.dbTableName);
        newsSeo.Load(p.Val(newsRow["num"]));
        description.Text = p.cut_str(newsSeo.Data.description, _descTextMax);
    }

    #endregion
}