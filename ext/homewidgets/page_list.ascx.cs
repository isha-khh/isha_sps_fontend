using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;
using System.Web.UI.HtmlControls;

public partial class ext_homewidgets_page_list : ez.web.controls.ControlBase
{
    private pages pages = new pages();

    // /*BlockTitle 參數, 設定區塊標題 (預設值 "首頁單元列表") */
    private string _BlockTitle = "首頁單元列表";
    public string BlockTitle { get { return _BlockTitle; } set { _BlockTitle = value; } }

    // /*PageNumber 參數, 單元流水號 */
    private string _PageNumber = "";
    public string PageNumber { get { return _PageNumber; } set { _PageNumber = value; } }

    /*PageSize 參數, 設定讀取的資料筆數 (預設值 4) */
    private int _PageSize = 4;
    public int PageSize { get { return _PageSize; } set { _PageSize = value; } }

    /*picWidth 參數, 設定圖片的寬 (預設值 "640") */
    private string _picWidth = "640";
    public string picWidth { get { return _picWidth; } set { _picWidth = value; } }
    /*picHeight 參數, 設定圖片的高 (預設值 "480") */
    private string _picHeight = "480";
    public string picHeight { get { return _picHeight; } set { _picHeight = value; } }
    /*picNoImg 參數, 當沒有圖片時用的圖，如果圖片路徑為upload/noimg.jpg，那請設為noimg.jpg即可 (預設值 "../App_Script/noimage_us.jpg") */
    private string _picNoImg = "../App_Script/noimage_us.jpg";
    public string picNoImg { get { return _picNoImg; } set { _picNoImg = value; } }

    /*autoPlay 參數, 設定轉盤是否自動播放 (預設值 "true" ) */
    private string _autoPlay = "true";
    public string autoPlay { get { return _autoPlay; } set { _autoPlay = value; } }
    /*showCol 參數, 設定轉盤顯示個數 (預設值 "4,3,2,1,1") */
    private string _slidesCol = "4,3,2,1,1";
    public string slidesCol { get { return _slidesCol; } set { _slidesCol = value; } }
    public string[] slidesToShow = { "4", "3", "2", "1", "1" };

    public string PageRoot = "";


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

            PageUint();
            Pnation();
        }
    }

    #region 單元頁面
    protected void Pnation()
    {
        foreach (string item in _PageNumber.Split(','))
        {
            pages.Load(f.Val(item));
            if (nation == pages.Data.nation) PageRoot = f.ValString(pages.Data.num);
        }
    }

    protected void PageUint()
    {
        DataTable dt = pages.RowDataTable(_PageNumber.Split(','), nation, f.ValString(_PageSize));
        if (dt.Rows.Count > 0)
        {
            PagesRepeater.DataSource = dt;
            PagesRepeater.DataBind();
        }
    }

    protected void PagesItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        DataRowView row = (DataRowView)e.Item.DataItem;
        pages.Load(f.Val(f.ValString(row["num"])));
        seo seo = new seo(pages.dbTableName);
        seo.Load(f.Val(f.ValString(row["num"])));

        Literal kind = (Literal)e.Item.FindControl("kind");
        Label word = (Label)e.Item.FindControl("word");
        Image pic = (Image)e.Item.FindControl("pic");
        string rootDir = pages.Dir.Replace("~/", "");

        kind.Text = p.cut_str(pages.Data.kind, 34);
        word.Text = p.cut_str(seo.Data.title, 117);

        pic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + _picNoImg + "&w=" + _picWidth + "&h=" + _picHeight;
        if (!f.isStrNull(pages.Data.pic[0]))
        {
            pic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + pages.Data.pic[0] + "&rootDir=" + rootDir + "&w=" + _picWidth + "&h=" + _picHeight;
        }

        if (f.isStrNull(kind.Text)) kind.Visible = false;
        if (f.isStrNull(word.Text)) word.Visible = false;

        HyperLink HyperLink1 = (HyperLink)e.Item.FindControl("HyperLink1");
        HyperLink1.NavigateUrl = "~/page/about/index.aspx?kind=" + pages.Data.num;
        if (!f.isStrNull(pages.Data.link))
        {
            HyperLink1.NavigateUrl = pages.Data.link;
            HyperLink1.Target = "_blank";
        }

    }
    #endregion

}
