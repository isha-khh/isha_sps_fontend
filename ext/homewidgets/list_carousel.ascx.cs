using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class list_carousel : ez.web.controls.ControlBase
{
    /*DataSource 參數, 設定讀取的資料來源 (預設值 "news") */
    private string _DataSource = "news";
    public string DataSource { get { return _DataSource; } set { _DataSource = value; } }
    /*PageSize 參數, 設定讀取的資料筆數 (預設值 6) */
    private int _PageSize = 6;
    public int PageSize { get { return _PageSize; } set { _PageSize = value; } }
    /*ParCategory 參數, 設定取用資料類別 (預設值 "首頁訊息")*/
    private string _ParCategory = "";
    public string ParCategory { get { return _ParCategory; } set { _ParCategory = value; } }
    /*Kind 參數, 設定取用資料分類 (無預設值) */
    private int _Kind = 0;
    public int Kind { get { return _Kind; } set { _Kind = value; } }
    /*BlockTitle 參數, 設定區塊標題 (預設值 "最新消息") */
    private string _BlockTitle = "";
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
    /*showCol 參數, 設定轉盤顯示個數 (預設值 "4,3,2,1,1" ;) */
    private string _slidesCol = "4,3,2,1,1";
    public string slidesCol { get { return _slidesCol; } set { _slidesCol = value; } }
    public string[] slidesToShow = { "4", "3", "2", "1", "1" };

    product product = new product();
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

            switch (_DataSource)
            {
                //最新商品
                case "product":
                    _ParCategory = (_ParCategory == "") ? "首頁商品" : _ParCategory;
                    _BlockTitle = (_BlockTitle == "") ? "最新商品" : _BlockTitle;
                    TopProduct();
                    break;

                //相簿專區
                case "album":
                    _BlockTitle = (_BlockTitle == "") ? "相簿專區" : _BlockTitle;
                    TopAlbum();
                    break;

                //最新消息 (預設值)
                default:
                    _ParCategory = (_ParCategory == "") ? "首頁訊息" : _ParCategory;
                    _BlockTitle = (_BlockTitle == "") ? "最新消息" : _BlockTitle;
                    TopNews();
                    break;
            }

        }
    }

    #region 最新消息

    protected void TopNews()
    {
        news news = new news();
        news.DataQuery queryInfo = new news.DataQuery();
        queryInfo.SelectColumns = "nation,num,subject,kind,uptime,link,pic1";
        queryInfo.PageSize = _PageSize;
        queryInfo.nation = nation;
        if (_Kind > 0) queryInfo.kind = _Kind;
        queryInfo.category = _ParCategory;
        queryInfo.inTime = true;
        queryInfo.NowPage = 1;
        news.QuerySource = queryInfo;
        if (news.Query())
        {
            ListRepeater.DataSource = news.QueryView;
            ListRepeater.DataBind();
        }
    }

    #endregion

    #region 最新商品

    protected void TopProduct()
    {

        product.DataQuery queryInfo = new product.DataQuery();
        queryInfo.SelectColumns = "num,pro_name,description,pic,range,price";   //需包含group by的欄位，所以range需加上
        queryInfo.PageSize = _PageSize;
        queryInfo.nation = nation;
        if (_Kind > 0) queryInfo.pro_kind = _Kind;
        queryInfo.Sort = "range";
        queryInfo.category = _ParCategory;
        queryInfo.inTime = true;
        queryInfo.NowPage = 1;
        queryInfo.selectTop = true;
        product.QuerySource = queryInfo;
        if (product.Query())
        {
            ListRepeater.DataSource = product.QueryView;
            ListRepeater.DataBind();
        }
    }

    #endregion

    #region 相簿專區

    protected void TopAlbum()
    {
        album album = new album();
        album.DataQuery queryInfo = new album.DataQuery();
        queryInfo.SelectColumns = "nation,num,subject,kind,word";
        queryInfo.PageSize = _PageSize;
        queryInfo.nation = nation;
        if (_Kind > 0) queryInfo.kind = _Kind;
        queryInfo.inTime = true;
        queryInfo.NowPage = 1;
        album.QuerySource = queryInfo;
        if (album.Query())
        {
            ListRepeater.DataSource = album.QueryView;
            ListRepeater.DataBind();
        }
    }

    #endregion


    protected void ListRepeater_ItemDataBound(object sender, RepeaterItemEventArgs e)
    {
        switch (_DataSource)
        {
            #region 最新商品
            case "product":

                DataRowView productRow = (DataRowView)e.Item.DataItem;
                Literal proName = (Literal)e.Item.FindControl("subject");
                Literal productDescription = (Literal)e.Item.FindControl("description");
                Literal producPrice = (Literal)e.Item.FindControl("price");
                Image productPic = (Image)e.Item.FindControl("pic");
                HyperLink productHyperLink = (HyperLink)e.Item.FindControl("HyperLink1");
                productPic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + _picNoImg + "&w=" + _picWidth + "&h=" + _picHeight;
                if (!p.isStrNull(productRow["pic"]))
                {
                    string rootDir = product.Dir.Replace("~/", "");
                    string[] pics = productRow["pic"].ToString().Split(',');
                    foreach (string picFile in pics)
                    {
                        if (!p.isStrNull(picFile))
                        {
                            productPic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + picFile + "&rootDir=" + rootDir + "&w=" + _picWidth + "&h=" + _picHeight;
                            break;
                        }
                    }
                }

                productHyperLink.NavigateUrl = "~/page/" + DataSource + "/show.aspx?num=" + p.ValString(productRow["num"]);


                proName.Text = p.cut_str(p.ValString(productRow["pro_name"]), 36);
                producPrice.Text = "$ " + p.ValString(productRow["price"]);
                seo productSeo = new seo(product.dbTableName);
                productSeo.Load(p.Val(productRow["num"]));
                productDescription.Text = p.cut_str(p.ValString(productRow["description"]), _descTextMax);
                break;
            #endregion

            # region 相簿專區
            case "album":
                album album = new album();
                album.photo photo = new album.photo();
                DataRowView albumRow = (DataRowView)e.Item.DataItem;
                Literal albumName = (Literal)e.Item.FindControl("subject");
                Literal albumDescription = (Literal)e.Item.FindControl("description");
                Image albumPic = (Image)e.Item.FindControl("pic");
                HyperLink albumHyperLink = (HyperLink)e.Item.FindControl("HyperLink1");

                albumPic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + _picNoImg + "&w=" + _picWidth + "&h=" + _picHeight;
                if (!p.isStrNull(photo.GetFirst(p.Val(albumRow["num"]))))
                {
                    string picFile = photo.GetFirst(p.Val(albumRow["num"]));
                    string rootDir = photo.Dir.Replace("~/", "");
                    albumPic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + picFile + "&rootDir=" + rootDir + "&w=" + _picWidth + "&h=" + _picHeight;
                }

                albumHyperLink.NavigateUrl = "~/page/" + DataSource + "/show.aspx?num=" + p.ValString(albumRow["num"]);


                albumName.Text = p.cut_str(p.ValString(albumRow["subject"]), 36);
                albumDescription.Text = p.cut_str(p.ValString(albumRow["word"]), _descTextMax);
                break;
            #endregion

            # region 最新消息 (預設值)
            default:
                news news = new news();
                DataRowView newsRow = (DataRowView)e.Item.DataItem;
                Literal newsName = (Literal)e.Item.FindControl("subject");
                Literal uptime = (Literal)e.Item.FindControl("uptime");
                Literal newsDescription = (Literal)e.Item.FindControl("description");
                Image newsPic = (Image)e.Item.FindControl("pic");
                HyperLink newsHyperLink = (HyperLink)e.Item.FindControl("HyperLink1");
                newsPic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + _picNoImg + "&w=" + _picWidth + "&h=" + _picHeight;
                if (!p.isStrNull(newsRow["pic1"]))
                {
                    string rootDir = news.Dir.Replace("~/", "");
                    string[] pics = newsRow["pic1"].ToString().Split(',');
                    foreach (string picFile in pics)
                    {
                        if (!p.isStrNull(picFile))
                        {
                            newsPic.ImageUrl = "~/app_script/DisplayCut.ashx?file=" + picFile + "&rootDir=" + rootDir + "&w=" + _picWidth + "&h=" + _picHeight;
                            break;
                        }
                    }
                }

                newsHyperLink.NavigateUrl = "~/page/" + DataSource + "/show.aspx?num=" + p.ValString(newsRow["num"]);
                if (!p.isStrNull(newsRow["link"]))
                {
                    newsHyperLink.NavigateUrl = p.ValString(newsRow["link"]);
                    newsHyperLink.Target = "_blank";
                }
                newsName.Text = p.cut_str(p.ValString(newsRow["subject"]), 36);
                uptime.Text = p.dateStr(newsRow["uptime"].ToString());

                seo newsSeo = new seo(news.dbTableName);
                newsSeo.Load(p.Val(newsRow["num"]));
                newsDescription.Text = p.cut_str(newsSeo.Data.description, _descTextMax);
                break;
                #endregion

        }

    }


}