using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class home_qa : ez.web.controls.ControlBase
{
    /*PageSize 參數, 設定讀取的資料筆數 (預設值 6) */
    private int _PageSize = 6;
    public int PageSize { get { return _PageSize; } set { _PageSize = value; } }
    /*ParCategory 參數, 設定取用資料類別 (預設值 "首頁問題")*/
    private string _ParCategory = "首頁問題";
    public string ParCategory { get { return _ParCategory; } set { _ParCategory = value; } }
    /*Kind 參數, 設定取用資料分類 (無預設值) */
    private int _Kind = 0;
    public int Kind { get { return _Kind; } set { _Kind = value; } }
    /*showKind 參數, 設定是否顯示分類名稱 (false) */
    private bool _showKind = false;
    public bool showKind { get { return _showKind; } set { _showKind = value; } }
    /*BlockTitle 參數, 設定區塊標題 (預設值 "常見問題") */
    private string _BlockTitle = "常見問題";
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

    QA QA = new QA();
    QA.kind qaKind = new QA.kind();

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

            TopQA();

            btnMore.Text = _t("查看更多");
            string addLinkPara = (_Kind > 0) ? "index.aspx?kind=" + _Kind : "index.aspx";
            btnMore.NavigateUrl = "~/page/faq/" + addLinkPara;
        }
    }

    protected void TopQA()
    {
        QA.DataQuery queryInfo = new QA.DataQuery();
        queryInfo.PageSize = _PageSize;
        queryInfo.SelectColumns = "quest,answer,num,kind,pic1";
        queryInfo.nation = nation;
        if (_Kind > 0) queryInfo.kind = _Kind;
        queryInfo.category = ParCategory;
        queryInfo.inTime = true;
        queryInfo.NowPage = 1;
        QA.QuerySource = queryInfo;
        if (QA.Query())
        {
            QARepeater.DataSource = QA.QueryView;
            QARepeater.DataBind();
        }
    }

    protected void QARepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView qaRow = (DataRowView)e.Item.DataItem;
        HyperLink knidLink = (HyperLink)e.Item.FindControl("knidLink");
        HyperLink itemLink = (HyperLink)e.Item.FindControl("itemLink");
        HyperLink picWrap = (HyperLink)e.Item.FindControl("picWrap");
        Literal title = (Literal)e.Item.FindControl("subject");
        Literal description = (Literal)e.Item.FindControl("description");
        Image pic = (Image)e.Item.FindControl("pic");

        if (_showKind)
        {
            knidLink.NavigateUrl = "~/page/faq/index.aspx?kind=" + p.Val(qaRow["kind"]);
            knidLink.Text = qaKind.kindText(p.Val(qaRow["kind"]), false);
            knidLink.Visible = _showKind;
        }

        string addLinkPara = (_Kind > 0) ? "&kind=" + _Kind : "";
        itemLink.NavigateUrl = "~/page/faq/show.aspx?num=" + p.ValString(qaRow["num"]) + addLinkPara;

        picWrap.NavigateUrl = itemLink.NavigateUrl;

        pic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + _picHeight + "&w=" + _picWidth + "&h=" + _picHeight;
        if (!p.isStrNull(qaRow["pic1"]))
        {
            string rootDir = QA.Dir.Replace("~/", "");
            string[] pics = qaRow["pic1"].ToString().Split(',');
            foreach (string picFile in pics)
            {
                if (!p.isStrNull(picFile))
                {
                    pic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + picFile + "&rootDir=" + rootDir + "&w=" + _picWidth + "&h=" + _picHeight;
                    break;
                }
            }
        }

        title.Text = p.cut_str(p.ValString(qaRow["quest"]), 36);

        seo qaSeo = new seo(QA.dbTableName);
        qaSeo.Load(p.Val(qaRow["num"]));
        description.Text = p.cut_str(qaSeo.Data.description, _descTextMax);

    }
}